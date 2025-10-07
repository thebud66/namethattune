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
                    { name, image_url: imageUrl }
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
                    { name, image_url: imageUrl }
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
        <div className="modal-overlay">
            <div className="modal">
                <h2 className="modal-title">
                    {player.player_id ? "Edit" : "Add"} Player
                </h2>

                <div className="form-group">
                    <label>Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter player name"
                    />
                </div>

                <div className="form-group">
                    <label>Profile Image</label>
                    <input type="file" onChange={handleFileChange} accept="image/*" />
                </div>

                <div className="image-preview">
                    <img
                        src={imageUrl || "/images/usr_placeholder.png"}
                        alt="preview"
                        className="preview-avatar"
                    />
                </div>

                <div className="modal-actions">
                    <button onClick={onClose} className="btn-secondary">
                        Cancel
                    </button>
                    <button onClick={handleSave} className="btn-primary">
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
}

export default EditPlayerModal;