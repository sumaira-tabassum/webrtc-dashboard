"use client";

import { useEffect, useState, useRef } from "react";
import { ChevronDown, Check } from "lucide-react";

type User = {
    id: string;
    full_name: string;
    email: string;
};

type Props = {
    selectedUsers: string[];
    setSelectedUsers: React.Dispatch<React.SetStateAction<string[]>>;
};

export default function UsersMultiSelect({
    selectedUsers,
    setSelectedUsers,
}: Props) {
    const [users, setUsers] = useState<User[]>([]);
    const [open, setOpen] = useState(false);

    const ref = useRef<HTMLDivElement>(null);

    const formatName = (name: string) => {
        if (!name) return "";

        const cleaned = name.replace(/\s+/g, ""); // remove spaces

        if (cleaned.length <= 4) return cleaned;

        return cleaned.slice(0, 4) + "...";
    };

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (
                ref.current &&
                !ref.current.contains(e.target as Node)
            ) {
                setOpen(false);
            }
        }

        document.addEventListener(
            "mousedown",
            handleClickOutside
        );

        return () =>
            document.removeEventListener(
                "mousedown",
                handleClickOutside
            );
    }, []);

    useEffect(() => {
        const fetchUsers = async () => {
            const res = await fetch("/api/users", {
                cache: "no-store",
            });

            const data = await res.json();
            setUsers(data);
        };

        fetchUsers();
    }, []);

    const handleToggle = (id: string) => {
        if (selectedUsers.includes(id)) {
            setSelectedUsers(selectedUsers.filter((u) => u !== id));
        } else {
            setSelectedUsers([...selectedUsers, id]);
        }
    };

    return (
        <div
            ref={ref}
            className=" relative w-full">

            {/* Trigger */}
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="
          w-full h-12 px-4
          rounded-xl
          border border-[#c7c4d7]
          bg-white
          flex items-center justify-between
          tracking-wider
          cursor-default
          "
            >
                <span className="text-[#4648d4] text-sm font-semibold">
                    <div className="flex items-center gap-2 overflow-hidden whitespace-nowrap">
                        {selectedUsers.length === 0 ? (
                            <span className="text-primary text-sm font-semibold">
                                Select users...
                            </span>
                        ) : (() => {
                            const selectedUserObjects = users.filter((u) =>
                                selectedUsers.includes(u.id)
                            );

                            const visibleUsers = selectedUserObjects.slice(0, 2);
                            const remainingCount =
                                selectedUserObjects.length - visibleUsers.length;

                            return (
                                <div className="flex items-center gap-2 overflow-hidden whitespace-nowrap">
                                    {visibleUsers.map((user) => (
                                        <div
                                            key={user.id}
                                            className="
            shrink-0
            px-3 py-1
            rounded-full
            bg-[#F2ECFF]
            text-primary
            text-xs
            font-medium
        "
                                            title={user.full_name} // hover shows full name
                                        >
                                            {formatName(user.full_name)}
                                        </div>
                                    ))}

                                    {remainingCount > 0 && (
                                        <div
                                            className="
            shrink-0
            px-2 py-1
            rounded-full
            bg-gray-100
            text-gray-500
            text-xs
            font-medium
          "
                                        >
                                            +{remainingCount}
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                    </div>
                </span>


                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4648d4]/40">
                    <ChevronDown
                        size={20}
                        className={`transition ${open ? "rotate-180" : ""}`}
                    />
                </span>
            </button>

            {/* Dropdown */}
            {open && (
                <div
                    className="
            absolute z-50 mt-2 w-full
            bg-white
            rounded-xl
            border border-[#c7c4d7]
            shadow-lg
            max-h-56 
            overflow-auto
            whitespace-nowrap
            no-scrollbar
          "
                >
                    {users.map((user) => (
                        <button
                            key={user.id}
                            type="button"
                            onClick={() => handleToggle(user.id)}
                            className="
        w-full px-4 py-3
        flex items-center
        hover:bg-[#f4f5ff]
        transition
    "
                        >
                            {/* Text section */}
                            <div className="flex-1 min-w-0 text-left">
                                <p
                                    className="
                text-sm font-medium text-[#131b2e]
                truncate
            "
                                    title={user.full_name}
                                >
                                    {user.full_name}
                                </p>

                                <p
                                    className="
                text-xs text-gray-500
                truncate
            "
                                    title={user.email}
                                >
                                    {user.email}
                                </p>
                            </div>

                            {/* Reserved tick space */}
                            <div className="w-6 flex justify-end shrink-0">
                                {selectedUsers.includes(user.id) && (
                                    <Check
                                        size={18}
                                        className="text-green"
                                    />
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}