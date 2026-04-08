import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, activityTable } from "@workspace/db";
import {
  CreateUserBody,
  UpdateUserBody,
  GetUserParams,
  UpdateUserParams,
  DeleteUserParams,
} from "@workspace/api-zod";
import { eq } from "drizzle-orm";

const router = Router();

function parseUser(user: typeof usersTable.$inferSelect) {
  return {
    ...user,
    projectIds: JSON.parse(user.projectIds) as number[],
  };
}

router.get("/", async (req, res) => {
  const users = await db.select().from(usersTable).orderBy(usersTable.createdAt);
  res.json(users.map(parseUser));
});

router.post("/", async (req, res) => {
  const body = CreateUserBody.parse(req.body);
  const [user] = await db
    .insert(usersTable)
    .values({
      ...body,
      projectIds: JSON.stringify(body.projectIds ?? []),
    })
    .returning();

  await db.insert(activityTable).values({
    type: "user_added",
    description: `New user "${user.name}" added as ${user.role}`,
    userName: user.name,
  });

  res.status(201).json(parseUser(user));
});

router.get("/:id", async (req, res) => {
  const { id } = GetUserParams.parse({ id: parseInt(req.params.id) });
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(parseUser(user));
});

router.put("/:id", async (req, res) => {
  const { id } = UpdateUserParams.parse({ id: parseInt(req.params.id) });
  const body = UpdateUserBody.parse(req.body);
  const [user] = await db
    .update(usersTable)
    .set({
      ...body,
      projectIds: body.projectIds !== undefined ? JSON.stringify(body.projectIds) : undefined,
    })
    .where(eq(usersTable.id, id))
    .returning();
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(parseUser(user));
});

router.delete("/:id", async (req, res) => {
  const { id } = DeleteUserParams.parse({ id: parseInt(req.params.id) });
  await db.delete(usersTable).where(eq(usersTable.id, id));
  res.status(204).send();
});

export default router;
