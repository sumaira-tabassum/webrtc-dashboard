import { Server } from "socket.io";

const io = new Server(3001, {
    cors: { origin: [
        "http://localhost:3000",
        "http://192.168.1.8:3000",
    ]
     },
});

const rooms = new Map<string, Set<string>>();

io.on("connection", (socket) => {
    console.log("connected:", socket.id);

    socket.on("create-room", (roomId: string) => {
        rooms.set(roomId, new Set([socket.id]));
        socket.join(roomId);    //Adds socket to Socket.IO room.

        // Send event only to this socket.
        socket.emit("role-assigned", { role: "admin" });
        
        console.log("ROOM CREATED:", roomId);
    });

    socket.on("join-room", (roomId, callback) => {
        const room = rooms.get(roomId);

        if (!room) {
            // Sends error back to joining user.
            socket.emit("room-error", "Room does not exist");
            return;
        }

        if (room.size >= 2) {
            socket.emit("room-error", "Room is full");
            return;
        }

        room.add(socket.id);
        // Put second user into same Socket.io room.
        socket.join(roomId);

        callback({ ok: true });

        console.log("USER JOINED:", roomId, socket.id);

        // creates object
        const payload = {
            roomId,
            // Array.from(room): converts set into array
            users: Array.from(room).map((id) => ({
                socketId: id,
                role: id === socket.id ? "you" : "peer",
            })),
        };

        // io.to(roomId).emit(...): everyone in room
        io.to(roomId).emit("room-users", payload);
    });

    // Added to fix timing issues.
    socket.on("get-room-users", (roomId: string) => {
        const room = rooms.get(roomId);
        if (!room?.has(socket.id)) return;

        socket.emit("room-users", {
            roomId,
            users: Array.from(room).map((id) => ({
                socketId: id,
                role: id === socket.id ? "you" : "peer",
            })),
        });
    });

    // OFFER handler
    socket.on("offer", ({ roomId, offer }) => {
        const room = rooms.get(roomId);
        if (!room || !room.has(socket.id)) return;

        socket.to(roomId).emit("offer", {
            offer,
            from: socket.id,
        });
    });

    // ANSWER handler
    socket.on("answer", ({ roomId, answer }) => {
        const room = rooms.get(roomId);
        if (!room || !room.has(socket.id)) return;

        socket.to(roomId).emit("answer", {
            answer,
            from: socket.id,
        });
    });

    socket.on("leave-room", (roomId: string) => {
        const room = rooms.get(roomId);
        if (!room?.has(socket.id)) return;

        room.delete(socket.id);
        socket.leave(roomId);

        if (room.size === 0) {
            rooms.delete(roomId);
        }
    });

    // ICE CANDIDATE handler
    socket.on("ice-candidate", ({ roomId, candidate }) => {
        const room = rooms.get(roomId);
        if (!room || !room.has(socket.id)) return;

        socket.to(roomId).emit("ice-candidate", {
            candidate,
            from: socket.id,
        });
    });

    socket.on("disconnect", () => {
        console.log("disconnected:", socket.id);

        // cleanup
        for (const [roomId, users] of rooms.entries()) {
            if (users.has(socket.id)) {
                users.delete(socket.id);

                if (users.size === 0) {
                    rooms.delete(roomId);
                }
            }
        }
    });
});

console.log("Socket running on 3001");