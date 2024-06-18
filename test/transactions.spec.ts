import { expect, it, beforeAll, afterAll, describe, beforeEach } from 'vitest'
import { execSync } from 'node:child_process'
import request from 'supertest'
import { app } from '../src/app'

describe('Transactions routes', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    execSync('npm run knex migrate:rollback --all')
    execSync('npm run knex migrate:latest')
  })

  it('should be able to create a new transaction', async () => {
    const response = await request(app.server)
      .post('/transactions')
      .send({
        title: 'New transaction',
        amount: 3000,
        type: 'credit',
      })
      .expect(201)

    expect(response).toHaveProperty('body')
    expect(response.body).toHaveProperty('id')
    expect(response.body).toHaveProperty('title', 'New transaction')
    expect(response.body).toHaveProperty('amount', 3000)
  })

  it('should be able to list all transactions', async () => {
    const createTransactionResponse = await request(app.server)
      .post('/transactions')
      .send({
        title: 'New transaction',
        amount: 3000,
        type: 'credit',
      })

    const cookies = createTransactionResponse.get('Set-Cookie') || []

    const listTransactionsResponse = await request(app.server)
      .get('/transactions')
      .set('Cookie', cookies)
      .expect(200)

    expect(listTransactionsResponse).toHaveProperty('body')
    expect(listTransactionsResponse.body).toHaveProperty('transactions')
    expect(listTransactionsResponse.body.transactions).toBeInstanceOf(Array)
    expect(listTransactionsResponse.body.transactions).toEqual([
      expect.objectContaining({
        title: 'New transaction',
        amount: 3000,
      }),
    ])
  })

  it('should be able to get a specific transaction', async () => {
    const createTransactionResponse = await request(app.server)
      .post('/transactions')
      .send({
        title: 'New transaction',
        amount: 3000,
        type: 'credit',
      })

    const cookies = createTransactionResponse.get('Set-Cookie') || []

    expect(createTransactionResponse).toHaveProperty('body')
    expect(createTransactionResponse.body).toHaveProperty('id')
    const transactionId = createTransactionResponse.body.id || ''

    const getTransactionResponse = await request(app.server)
      .get(`/transactions/${transactionId}`)
      .set('Cookie', cookies)
      .expect(200)

    expect(getTransactionResponse).toHaveProperty('body')
    expect(getTransactionResponse.body).toHaveProperty('transaction')
    expect(getTransactionResponse.body.transaction).toEqual(
      expect.objectContaining({
        title: 'New transaction',
        amount: 3000,
      }),
    )
  })

  it('should be able to get summary', async () => {
    const createTransactionResponse = await request(app.server)
      .post('/transactions')
      .send({
        title: 'New transaction',
        amount: 3000,
        type: 'credit',
      })

    const cookies = createTransactionResponse.get('Set-Cookie') || []

    await request(app.server)
      .post('/transactions')
      .set('Cookie', cookies)
      .send({
        title: 'Debit transaction',
        amount: 2000,
        type: 'debit',
      })

    const getSummaryResponse = await request(app.server)
      .get('/transactions/summary')
      .set('Cookie', cookies)
      .expect(200)

    expect(getSummaryResponse).toHaveProperty('body')
    expect(getSummaryResponse.body).toHaveProperty('summary')
    expect(getSummaryResponse.body.summary).toEqual(
      expect.objectContaining({
        amount: 1000,
      }),
    )
  })
})
