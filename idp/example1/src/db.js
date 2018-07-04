import low from 'lowdb';
import FileSync from 'lowdb/adapters/FileSync';
import * as config from './config';

const adapter = new FileSync(config.dbPath);
const db = low(adapter);

// Set some defaults (required if your JSON file is empty)
db.defaults({
  references: [],
  users: [],
  requests: [],
  // userCount: 0,
}).write();

export const getReference = (referenceId) => {
  return db
    .get('references')
    .find({ id: referenceId })
    .value();
};

export const addOrUpdateReference = (referenceId, data) => {
  const existingReference = getReference(referenceId);
  if (existingReference != null) {
    db.get('references')
      .find({ id: referenceId })
      .assign(data)
      .write();
  } else {
    db.get('references')
      .push({
        id: referenceId,
        ...data,
      })
      .write();
  }
};

export const removeReference = (referenceId) => {
  db.get('references')
    .remove({ id: referenceId })
    .write();
};

export const getUser = (userId) => {
  return db
    .get('users')
    .find({ id: userId })
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
      identifier,
    })
    .value();
};

export const addUser = (namespace, identifier, data) => {
  let checkUser = getUserByIdentifier(namespace, identifier);
  if (checkUser && checkUser.id) return 0;
  const id = `${namespace}-${identifier}`;
  db.get('users')
    .push({
      id,
      namespace,
      identifier,
      ...data,
    })
    .write();
  return id;
};

export const updateUser = (namespace, identifier, data) => {
  db.get('users')
    .find({ namespace, identifier })
    .assign(data)
    .write();
};

export const removeUser = (namespace, identifier) => {
  db.get('users')
    .remove({
      namespace,
      identifier,
    })
    .write();
};

export const saveRequest = (userId, request) => {
  db.get('requests')
    .push({
      userId,
      request,
    })
    .write();
};

export const getRequest = (userId, requestId) => {
  //console.log(userId,requestId);
  const requestWithUserId = db
    .get('requests')
    .find({ userId, request: { request_id: requestId } })
    .value();
  const request = requestWithUserId.request;
  return request;
};

export const getRequests = (userId) => {
  const requestsWithUserId = db
    .get('requests')
    .filter({ userId })
    .value();
  const requests = requestsWithUserId.map(
    (requestWithUserId) => requestWithUserId.request
  );
  return requests;
};

export const removeRequest = (requestId) => {
  db.get('requests')
    .remove({ request: { request_id: requestId } })
    .write();
};
