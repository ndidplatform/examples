if(process.env.KEY_PATH) {
  if(process.env.KEY_PATH[process.env.KEY_PATH.length - 1] !== '/')
    process.env.KEY_PATH += '/';
}

export const dbName = process.env.DB_NAME || 'db.json';
export const keyPath = process.env.KEY_PATH || './dev_user_key_for_' + dbName.split('.')[0] + '/';