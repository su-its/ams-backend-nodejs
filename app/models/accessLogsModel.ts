/* eslint-disable no-unused-vars */
import { connection as mysql } from '../database/db'

const TABLENAME = 'access_logs'

type AccessLog = {
  'user_id': number,
  'entered_at': Date,
  'exited_at': Date
}

async function createAccessLog (userId: number, enteredAt: Date) {
  // INSERT すると [ResultSetHeader, undefined] が返ってくる
  await mysql.query(`INSERT INTO ${TABLENAME} (user_id, entered_at) VALUES (?, ?)`,
    [userId, enteredAt])
}

/**
 * access_logsの総行数を取得する
 */
async function getCountOfAccessLogs () {
  // https://stackoverflow.com/a/11412968
  const [rows, _] = await mysql.query(`SELECT count(*) AS logCount FROM ${TABLENAME}`)

  if (Array.isArray(rows) && rows.length === 1) {
    const row = rows[0]
    if ('logCount' in row) {
      // SQLの仕様からしてcount()の返り値は整数なのでアサーションしても問題ない
      return row.logCount as number
    }
  }

  throw new Error('response from DB is malformed')
}

async function listAccessLogs (
  since?: string, until?: string,
  order = 'DESC', limit = 100, offset = 0
) {
  const [rows, _] = await mysql.query(
    `SELECT * FROM ${TABLENAME} ` +
    "WHERE exited_at >= IFNULL(?, '1970-01-01') " +
    'AND entered_at < ADDDATE(IFNULL(?, CURDATE()), 1) ' +
    `ORDER BY entered_at ${['ASC', 'DESC'].includes(order) ? order : 'DESC'} ` +
    'LIMIT ? OFFSET ?',
    [since, until, limit, offset])

  if (Array.isArray(rows)) {
    return rows as AccessLog[]
  }

  throw new Error('response from DB is not an array')
}

export { createAccessLog, getCountOfAccessLogs, listAccessLogs }
