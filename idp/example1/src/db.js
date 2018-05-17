import low from 'lowdb';
import FileSync from 'lowdb/adapters/FileSync';

const adapter = new FileSync('db.json');
const db = low(adapter);

// Set some defaults (required if your JSON file is empty)
db
  .defaults({
    users: [],
    requests: [],
    userCount: 0
  })
  .write();

export const getUser = (userId) => {
  return db
    .get('users')
    .find({ id: parseInt(userId) })
    .value();
};

/*export const getUserByCid = (cid) => {
  return db
    .get('users')
    .find({ citizenId: cid.toString() })
    .value();
};*/

export const getUserByIdentifier = (namespace, identifier) => {
  return db
    .get('users')
    .find({
      namespace,
      identifier
    })
    .value();
};

export const addUser = (namespace, identifier) => {
  let checkUser = getUserByIdentifier(namespace, identifier);
  if(checkUser && checkUser.id) return 0;
  let newId = db.get('userCount').value() + 1;
  db.get('users')
    .push({
      id: newId,
      namespace,
      identifier
    })
    .write();
  db.update('userCount', (n) => n + 1)
    .write();
  return newId;
};

export const saveRequest = (userId, request) => {
  db
    .get('requests')
    .push({
      userId: parseInt(userId),
      request,
    })
    .write();
};

export const getRequest = (userId, requestId) => {
  //console.log(userId,requestId);
  const requestWithUserId = db
    .get('requests')
    .find({ userId: parseInt(userId), request: { request_id: requestId } })
    .value();
  const request = requestWithUserId.request;
  return request;
};

export const getRequests = (userId) => {
  const requestsWithUserId = db
    .get('requests')
    .filter({ userId: parseInt(userId) })
    .value();
  const requests = requestsWithUserId.map(
    (requestWithUserId) => requestWithUserId.request
  );
  return requests;
};

export const removeRequest = (requestId) => {
  db
    .get('requests')
    .remove({ request: { request_id: requestId } })
    .write();
};
