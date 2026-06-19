"use client";

import { useEffect, useState } from "react";
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
        <div className="relative w-full">

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
                    {selectedUsers.length === 0
                        ? "Select users..."
                        : selectedUsers.length === 1
                            ? "1 user selected"
                            : `${selectedUsers.length} users selected`}
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
                flex justify-between items-center
                hover:bg-[#f4f5ff]
                transition
              "
                        >
                            <div className="text-left">
                                <p className="text-sm font-medium text-[#131b2e]">
                                    {user.full_name}
                                </p>

                                <p className="text-xs text-gray-500">
                                    {user.email}
                                </p>
                            </div>

                            {selectedUsers.includes(user.id) && (
                                <Check
                                    size={18}
                                    className="text-[#4648d4]"
                                />
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}