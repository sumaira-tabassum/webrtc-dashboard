import { Server } from "socket.io";

const io = new Server(3001, {
    cors: { origin: "http://localhost:3000" },
});

// roomId → Set of socketIds
const rooms = new Map<string, Set<string>>();

// Connection. Runs whenever a browser connects.
io.on("connection", (socket) => {
    // Every browser gets unique id.
    console.log("connected:", socket.id);

    // Admin creates meeting.
    socket.on("create-room", (roomId: string) => {
        // Create room and store admin.
        rooms.set(roomId, new Set([socket.id]));
        // Put admin inside Socket.io room.
        socket.join(roomId);

        socket.emit("role-assigned", { role: "admin" });
        
        console.log("ROOM CREATED:", roomId);
    });

    // User joins room/meeting.
    socket.on("join-room", (roomId, callback) => {
        // Check room exists.
        const room = rooms.get(roomId);

        // If room doesn't exist
        if (!room) {
            socket.emit("room-error", "Room does not exist");
            return;
        }

        // If room full is full
        if (room.size >= 2) {
            socket.emit("room-error", "Room is full");
            return;
        }

        // Add second user
        room.add(socket.id);
        // Put second user into same Socket.io room.
        socket.join(roomId);

        // Tell frontend: Join succeeded
        callback({ ok: true });

        console.log("USER JOINED:", roomId, socket.id);

        // Notify everyone in room
        io.to(roomId).emit("room-users", {
            roomId,
            users: Array.from(room).map((id) => ({
                socketId: id,
                role: id === socket.id ? "you" : "peer",
            })),
        });
    });

    // OFFER handler

    // Server recieves roomId, offer (webRTC data)
    socket.on("offer", ({ roomId, offer }) => {
        // Find the room in memory
        const room = rooms.get(roomId);

        if (!room || !room.has(socket.id)) return;

        // Send this offer to everyone ELSE in the room except sender
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