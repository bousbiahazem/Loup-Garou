import { emitRoomUpdatesForUser } from "../realtime/roomBroadcaster.js";
import { createUserProfile, updateUserProfile } from "../services/userService.js";

export async function createUser(request, response) {
  const user = await createUserProfile(request.body);
  response.status(201).json({ user });
}

export async function updateUser(request, response) {
  const user = await updateUserProfile(request.params.userId, request.body);
  await emitRoomUpdatesForUser(user._id);
  response.json({ user });
}
