import express from "express";

const app = express();

app.get("/", (req, res) => {
  res.json({
    message: "Welcome to eLib Api's",
  });
});

export default app;
