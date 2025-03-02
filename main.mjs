import express from "express";
import cookieParser from "cookie-parser";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

const app = express();
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send(`
  <form method="post" action="/login">
    <input name="username" placeholder="username" />
    <input name="password" placeholder="password" type="password" />
    <button>submit</button>
  </form>
`);
});

app.post("/login", async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  const sessionId = crypto
    .createHash("sha256")
    .update(username + password)
    .digest("hex");

  await prisma.user.create({
    data: {
      username: username,
      password: password,
    },
  });

  const user = await prisma.user.findUnique({
    where: {
      username: username,
    },
  });

  await prisma.session.create({
    data: {
      id: sessionId,
      userId: user.id,
    },
  });

  res.cookie("session", sessionId);
  res.send(`
    <p>ようこそ！${username}さん！</p>
    <a href="/profile">プロフィールを表示</a>
`);
});

app.get("/profile", async (req, res) => {
  const sessionId = req.cookies["session"];
  const sessionInfo = await prisma.session.findUnique({
    where: {
      id: sessionId,
    },
  });

  const user = await prisma.user.findUnique({
    where: {
      id: sessionInfo.userId,
    },
  });

  res.send(`
    <ul>
      <li>名前: ${user.username}</li>
    </ul>
`);
});

app.listen(3000);
