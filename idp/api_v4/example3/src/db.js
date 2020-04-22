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
  accessors: [],
  // userCount: 0,
}).write();

export function getReference(referenceId) {
  return db
    .get('references')
    .find({ id: referenceId })
    .value();
}

export function addOrUpdateReference(referenceId, data) {
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
}

export function removeReference(referenceId) {
  db.get('references')
    .remove({ id: referenceId })
    .write();
}

export function getUser(userId) {
  return db
    .get('users')
    .find({ id: userId })
    .value();
}

/*export function getUserByCid(cid) {
  return db
    .get('users')
    .find({ citizenId: cid.toString() })
    .value();
}*/

export function getUserByIdentifier(namespace, identifier) {
  return db
    .get('users')
    .find({
      namespace,
      identifier,
    })
    .value();
}

export function getUserByReferenceGroupCode(reference_group_code) {
  return db
    .get('users')
    .find({
      reference_group_code,
    })
    .value();
}

export function addUser(namespace, identifier, reference_group_code, data) {
  let checkUser = getUserByIdentifier(namespace, identifier);
  if (checkUser && checkUser.id) return 0;
  const id = `${namespace}-${identifier}`;
  db.get('users')
    .push({
      id,
      namespace,
      identifier,
      reference_group_code,
      ...data,
    })
    .write();
  return id;
}

export function updateUser(namespace, identifier, data) {
  db.get('users')
    .find({ namespace, identifier })
    .assign(data)
    .write();
}

export function removeUser(namespace, identifier) {
  db.get('users')
    .remove({
      namespace,
      identifier,
    })
    .write();
}

export function saveRequest(userId, request) {
  db.get('requests')
    .push({
      userId,
      request,
    })
    .write();
}

export function getRequest(userId, requestId) {
  //console.log(userId,requestId);
  const requestWithUserId = db
    .get('requests')
    .find({ userId, request: { request_id: requestId } })
    .value();
  const request = requestWithUserId.request;
  return request;
}

export function getRequests(userId) {
  const requestsWithUserId = db
    .get('requests')
    .filter({ userId })
    .value();
  const requests = requestsWithUserId.map(
    (requestWithUserId) => requestWithUserId.request
  );
  return requests;
}

export function removeRequest(requestId) {
  db.get('requests')
    .remove({ request: { request_id: requestId } })
    .write();
}

export function getAccessor(accessorId) {
  return db
    .get('accessors')
    .find({
      accessorId,
    })
    .value();
}

export function addAccessor(accessorId, accessorData) {
  db.get('accessors')
    .push({
      accessorId,
      ...accessorData,
    })
    .write();
}
