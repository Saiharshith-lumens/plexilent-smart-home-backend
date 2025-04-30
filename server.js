// server.js
const express = require("express");
const bodyParser = require("body-parser");
const mqtt = require("mqtt");

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

// MQTT Setup
const mqttClient = mqtt.connect("mqtt://your-broker-ip", {
  username: "your-username",
  password: "your-password",
});

mqttClient.on("connect", () => {
  console.log("Connected to MQTT Broker");
});

// SYNC Handler
app.post("/smarthome", (req, res) => {
  const intent = req.body.inputs[0].intent;

  if (intent === "action.devices.SYNC") {
    const response = {
      requestId: req.body.requestId,
      payload: {
        agentUserId: "user-123",
        devices: [
          {
            id: "light-1",
            type: "action.devices.types.LIGHT",
            traits: ["action.devices.traits.OnOff"],
            name: { name: "Living Room Light" },
            willReportState: false,
          },
        ],
      },
    };
    res.json(response);
  } else if (intent === "action.devices.EXECUTE") {
    const command = req.body.inputs[0].payload.commands[0];
    const execution = command.execution[0];
    const deviceId = command.devices[0].id;
    const value = execution.params.on;

    // Publish to MQTT
    mqttClient.publish(`plexilent/${deviceId}`, value ? "ON" : "OFF");

    res.json({
      requestId: req.body.requestId,
      payload: {
        commands: [
          {
            ids: [deviceId],
            status: "SUCCESS",
            states: { on: value },
          },
        ],
      },
    });
  } else {
    res.status(400).send("Unknown intent");
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
