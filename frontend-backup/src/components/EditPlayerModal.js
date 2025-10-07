import React, { useState, useEffect } from "react";
import axios from "axios";

function EditPlayerModal({ player, onClose, onUpdate }) {
    const [name, setName] = useState("");
    const [imageUrl, setImageUrl] = useState("");

    useEffect(() => {
        if (player) {
            setName(player.name || "");
            setImageUrl(player.image_url || "");
        }
    }, [player]);

    // if (!player) return null;

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await axios.post("http://localhost:8000/api/upload/", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            setImageUrl(res.data.url);
            console.log("File uploaded, new URL:", res.data.url);
        } catch (err) {
            console.error("Upload failed", err);
        }
    };

    const handleSave = async () => {
        if (player.player_id == null) {
            try {
                const res = await axios.post(
                    `http://localhost:8000/api/players/`,
                    {
                        name,
                        image_url: imageUrl,
                    }
                );
                console.log("Creation successful", res.data);
                onUpdate(res.data);
                onClose();
            } catch (err) {
                console.error("Creation failed", err);
            }
        } else {
            try {
                const res = await axios.put(
                    `http://localhost:8000/api/players/${player.player_id}`,
                    {
                        name,
                        image_url: imageUrl,
                    }
                );
                console.log("Update successful", res.data);
                onUpdate(res.data);
                onClose();
            } catch (err) {
                console.error("Update failed", err);
            }
        }

    };

    if (!player) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
            <div className="bg-white p-6 rounded w-96">
                <h2 className="text-xl mb-4">{player.player_id ? "Edit" : "Add"} Player</h2>

                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                className="input-field"
                />

                <input type="file" onChange={handleFileChange} className="mb-4" />

                <div className="mb-4">
                    <img
                        src={imageUrl || "/images/usr_placeholder.png"}
                        alt="preview"
                    className="input-field"
                    />
                </div>

                <div className="flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 mr-2 border rounded">
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
}

export default EditPlayerModal;
