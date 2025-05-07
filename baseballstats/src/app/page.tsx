"use client";

import React, { useEffect } from "react";
import styles from "./page.module.css";
import PlayersList from "./PlayersList";

export default function Home() {
  useEffect(() => {
    // Fetch data from the /api/baseball endpoint
    fetch("http://localhost:3000/api/baseball")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Error: ${response.statusText}`);
        }
        return response.json();
      })
      
      .catch((error) => {
        console.error("Error fetching players:", error);
      });
  }, []);

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.ctas}>
          <PlayersList />
        </div>
      </main>
      <footer className={styles.footer}></footer>
    </div>
  );
}
