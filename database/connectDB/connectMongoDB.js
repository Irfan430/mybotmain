module.exports = async function (uriConnect) {
	const mongoose = require("mongoose");

	const threadModel = require("../models/mongodb/thread.js");
	const userModel = require("../models/mongodb/user.js");
	const dashBoardModel = require("../models/mongodb/userDashBoard.js");
	const globalModel = require("../models/mongodb/global.js");

	if (!uriConnect) {
		console.log("MONGODB ❌ Missing URI (config.database.uriMongodb)");
		throw new Error("MONGODB_URI_MISSING");
	}

	try {
		console.log("MONGODB ℹ️ Connecting...");
		await mongoose.connect(uriConnect, {
			useNewUrlParser: true,
			useUnifiedTopology: true
		});
		console.log("MONGODB ✅ Connected");
	} catch (err) {
		console.log("MONGODB ❌ Initial connect failed:", err.message);
		throw err;
	}

	mongoose.connection.on("error", (e) => console.log("MONGODB ❌ Connection error:", e?.message || e));
	mongoose.connection.on("disconnected", () => console.log("MONGODB ⚠️ Disconnected"));
	mongoose.connection.on("reconnected", () => console.log("MONGODB ✅ Reconnected"));

	return {
		threadModel,
		userModel,
		dashBoardModel,
		globalModel
	};
};
