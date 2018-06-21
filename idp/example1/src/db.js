/*
Copyright (c) 2018, 2019 National Digital ID COMPANY LIMITED 

This file is part of NDID software.

NDID is the free software: you can redistribute it and/or modify  it under the terms of the Affero GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or any later version.

NDID is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the Affero GNU General Public License for more details.

You should have received a copy of the Affero GNU General Public License along with the NDID source code.  If not, see https://www.gnu.org/licenses/agpl.txt.

please contact info@ndid.co.th for any further questions
*/

import low from 'lowdb';
import FileSync from 'lowdb/adapters/FileSync';
import * as config from './config';

const adapter = new FileSync(config.dbPath);
const db = low(adapter);

// Set some defaults (required if your JSON file is empty)
db
  .defaults({
    users: [],
    requests: [],
    userCount: 0,
    accessor: [],
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

export const getAccessorIdBySid = (sid) => {
  return db
    .get('accessor')
    .find({
      sid,
    })
    .value();
};

export const setAccessorIdBySid = (sid, accessor_id) => {
  db.get('accessor')
  .push({
    sid,
    accessor_id,
  })
  .write();
};

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
