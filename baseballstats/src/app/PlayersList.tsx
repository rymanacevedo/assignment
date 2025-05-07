"use client";

import React, { useEffect, useState } from "react";

interface Player {
  _id: string; // MongoDB ObjectId as a string
  AVG: string;
  "At-bat": string;
  "Caught stealing": string;
  "Double (2B)": string;
  Games: string;
  Hits: string; // Hits per season
  "On-base Percentage": string;
  "On-base Plus Slugging": string;
  "Player name": string;
  Runs: string;
  "Slugging Percentage": string;
  Strikeouts: string;
  "a walk": string;
  "home run": string;
  position: string;
  "run batted in": string;
  "stolen base": string;
  "third baseman": string;
}

const PlayersList: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null); // Track which player is being edited
  const [editedName, setEditedName] = useState<string>(""); // Track the edited name
  const [playerData, setPlayerData] = useState<{ [key: string]: string }>({}); // Store data for each player by ID

  useEffect(() => {
    fetch("http://localhost:3000/api/baseball/players")
      .then((response) => response.json())
      .then((data) => {
        // Sort players by Hits in descending order
        const sortedPlayers = data.sort((a: Player, b: Player) => {
          const hitsA = parseInt(a.Hits) || 0; // Convert to number, default to 0 if invalid
          const hitsB = parseInt(b.Hits) || 0; // Convert to number, default to 0 if invalid
          return hitsB - hitsA; // Sort in descending order
        });
        setPlayers(sortedPlayers);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching players:", error);
        setLoading(false);
      });
  }, []);

  const handleEditClick = (playerId: string, currentName: string) => {
    setEditingPlayerId(playerId); // Set the player being edited
    setEditedName(currentName); // Set the current name in the input field
  };

  const handleSaveClick = async (playerId: string) => {
    try {
      const response = await fetch(`http://localhost:3000/api/baseball/players/${playerId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: editedName }), // Send the updated name to the backend
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Update only the specific player's name in the local state
      setPlayers((prevPlayers) =>
        prevPlayers.map((player) =>
          player._id === playerId ? { ...player, "Player name": editedName } : player
        )
      );

      setEditingPlayerId(null); // Exit edit mode
      setEditedName(""); // Clear the edited name
    } catch (error) {
      console.error("Error saving player name:", error);
    }
  };

  const handlePlayerClick = async (playerName: string, playerId: string) => {
    try {
      const response = await fetch("http://localhost:3000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: playerName }), // Send the player name in the request body
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setPlayerData((prevData) => ({
        ...prevData,
        [playerId]: `Random data for ${playerName}: ${data.response}`,
      }));
    } catch (error) {
      console.error("Error fetching player data:", error);
      setPlayerData((prevData) => ({
        ...prevData,
        [playerId]: "Error fetching player data.",
      }));
    }
  };

  if (loading) {
    return <div>Loading players...</div>;
  }

  return (
    <div>
      <h2>Player List (Ranked by Hits)</h2>
      <ul>
        {players.map((player, index) => (
          <li key={player._id} style={{ marginBottom: "10px" }}>
            <div>
              <strong>
                #{index + 1}: {player["Player name"]} 
                AVG:{player.AVG} 
                At Bat:{player["At-bat"]} 
                Caught Stealing:{player["Caught stealing"]} 
                Double:{player["Double (2B)"]} 
                Games:{player.Games} 
                On Base Percentage:{player["On-base Percentage"]} 
                On Base Plus Slugging:{player["On-base Plus Slugging"]} 
                Runs:{player.Runs} 
                Slugging Percentage:{player["Slugging Percentage"]} 
                Strikeouts:{player.Strikeouts} 
                Walk:{player["a walk"]} 
                Home Run:{player["home run"]} 
                Player Position:{player.position} 
                Run Batted In:{player["run batted in"]} 
                Stolen Base:{player["stolen base"]} 
                Third baseman: {player["third baseman"]}
              </strong>{" "}
              - {player.position} - Hits: {player.Hits}
              <button onClick={() => handleEditClick(player._id, player["Player name"])}>Edit</button>
              <button onClick={() => handlePlayerClick(player["Player name"], player._id)}>View Data</button>
            </div>
            {editingPlayerId === player._id && (
              <div>
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                />
                <button onClick={() => handleSaveClick(player._id)}>Save</button>
                <button onClick={() => setEditingPlayerId(null)}>Cancel</button>
              </div>
            )}
            {playerData[player._id] && (
              <div style={{ marginTop: "5px", color: "gray" }}>
                {playerData[player._id]}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PlayersList;