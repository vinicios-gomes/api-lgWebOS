import type { Express } from "express";
import express from "express";
import lgtv from "lgtv2";
import dotenv from "dotenv";

dotenv.config();

const TV_LOCAL_IP = process.env.TV_LOCAL_IP;
const TV_LOCAL_PORT = process.env.TV_LOCAL_PORT;

const con = lgtv({
  url: `ws://${TV_LOCAL_IP}:${TV_LOCAL_PORT}`,
  timeout: 5000,
  reconnect: 10000,
  keyFile: "./lgtvkeyfile",
});

const app: Express = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/vol-up", (req, response) => {
  con.request("ssap://audio/volumeUp", (err: Error, res: any) => {
    if (err) {
      console.error("Error increasing volume:", err);
      response.status(500).send("Error increasing volume");
    } else {
      response.send("Volume increased");
    }
  });
});

app.use("/media", (req, response) => {
  const type = req.query.type as string;
  if (type === "play") {
    con.request("ssap://media.controls/play", (err: Error, res: any) => {
      if (err) {
        console.error("Error playing media:", err);
        response.status(500).send("Error playing media");
      } else {
        response.send("Media playing");
      }
    });
  }
  if (type === "pause") {
    con.request("ssap://media.controls/pause", (err: Error, res: any) => {
      if (err) {
        console.error("Error pausing media:", err);
        response.status(500).send("Error pausing media");
      } else {
        response.send("Media paused");
      }
    });
  }
  if (type !== "play" && type !== "pause") {
    response.status(400).send("Invalid type parameter");
  }
});

app.use("/list-app-ids", (req, response) => {
  con.request("ssap://com.webos.applicationManager/listApps", (err, result) => {
    if (err) {
      console.error("Error listing app IDs:", err);
      response.status(500).send("Error listing app IDs");
    } else {
      response.json(result);
    }
  });
});

app.use("/message", (req, response) => {
  const { text } = req.body;
  con.request(
    "ssap://system.notifications/createToast",
    { message: text },
    (err, result) => {
      if (err) {
        response.status(500).send("Error");
        return;
      }
      return response.status(200).send(result);
    }
  );
});

app.use("/service-list", (req, response) => {
  con.request("ssap://api/getServiceList", (err, result) => {
    if (err) {
      console.error("Error getting service list:", err);
      response.status(500).send("Error getting service list");
    } else {
      response.json(result);
    }
  });
});

app.use("/teste", (req, response) => {
  con.request("luna://com.webos.service.wifi/getstatus", (err, sock) => {
    if (err) {
      console.log("ERROR");
      return response.status(500).send();
    }
    console.log("OK");
    // const command =
    //   "move\n" + "dx:" + 10 + "\n" + "dy:-10\n" + "down:0\n" + "\n";
    // sock.send(command);
    response.status(200).send(sock);
  });
});

app.use("/control", (req, response) => {
  const { buttonName } = req.body;

  con.getSocket(
    "ssap://com.webos.service.networkinput/getPointerInputSocket",
    (err, sock) => {
      if (err) {
        response.status(500).send("Error getting pointer input socket");
        return;
      }

      sock.send("button", { name: buttonName });
      response.status(200).send("Button pressed");
    }
  );
});

app.use("/mute", (req, response) => {
  const { mute } = req.query;
  con.request("ssap://audio/setMute", { mute }, (err, result) => {
    if (err) {
      console.error("Error muting volume:", err);
      response.status(500).send("Error muting volume");
    } else {
      response.send(`Volume ${mute === "true" ? "muted" : "unmuted"}`);
    }
  });
});

app.use("/turn-on", (req, response) => {
  con.request(
    "ssap://com.webos.applicationManager/launch",
    (err: Error, res: any) => {
      if (err) {
        console.error("Error turning on the TV:", err);
        response.status(500).send("Error turning on the TV");
      } else {
        response.send("TV turned on");
      }
    }
  );
});
app.use("/turn-off", (req, response) => {
  con.request("ssap://system/turnOff", (err: Error, res: any) => {
    if (err) {
      console.error("Error turning off the TV:", err);
      response.status(500).send("Error turning off the TV");
    } else {
      response.send("TV turned off");
    }
  });
});

app.use("/vol-down", (req, response) => {
  con.request("ssap://audio/volumeDown", (err: Error, res: any) => {
    if (err) {
      console.error("Error decreasing volume:", err);
      response.status(500).send("Error decreasing volume");
    } else {
      response.send("Volume decreased");
    }
  });
});
app.use("/vol", (req, response) => {
  const { value } = req.query;
  con.request(
    "ssap://audio/setVolume",
    {
      volume: Number(value),
    },
    (error, result) => {
      if (error) {
        response.status(500).send();
        return;
      }

      response.status(200).send(result);
      return;
    }
  );
  // response.status(200).send("volume seted");
});
app.use("/open-app", (req, response) => {
  const { appId } = req.query;
  con.request("ssap://system.launcher/launch", { id: appId });
  response.status(200).send(`App ${appId} opened`);
});

app.listen(3000, () => {
  con.on("connect", () => {
    console.log("Connected to TV");
  });

  con.on("connecting", (host) => {
    console.log(`Connecting to TV at ${host}`);
  });

  con.on("prompt", () => {
    console.log("Please accept the connection on your TV");
  });

  con.on("error", (err) => {
    console.error("Error connecting to TV:", err);
  });

  console.log("Server running on port 3000");
});
export default app;
