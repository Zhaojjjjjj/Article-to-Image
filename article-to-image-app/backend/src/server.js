const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const routes = require("./api/routes");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes
app.use("/api", routes);

// Health Check
app.get("/", (req, res) => {
	res.send("Article-to-Image API is running");
});

app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
