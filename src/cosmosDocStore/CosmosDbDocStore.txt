import { beforeEach, expect, jest, test } from '@jest/globals'
import { CosmosClient } from  '@azure/cosmos'
import { DocRecord, DocStoreDeleteByIdResultCode, DocStoreUpsertResultCode } from 'sengi-interfaces'
import { CosmosDbDocStore } from '../src'

const TEST_COSMOS_URL = process.env.SENGI_COSMOS_URL
const TEST_COSMOS_KEY = process.env.SENGI_COSMOS_KEY

function createCosmosDbDocStore (): CosmosDbDocStore {
  return new CosmosDbDocStore({
    cosmosUrl: TEST_COSMOS_URL || '',
    cosmosKey: TEST_COSMOS_KEY || '',
    getDatabaseNameFunc: () => 'sengi',
    getContainerNameFunc: (databaseName: string, docTypeName: string, docTypePluralName: string) => docTypePluralName,
    getPartitionKeyFunc: (databaseName: string, containerName: string, docTypeName: string, docTypePluralName: string, id: string) => docTypePluralName === 'trees' ? id : null
  })
}

async function initDb (): Promise<void> {
  const MAX_ITEMS_TO_DELETE = 10

  const cosmosClient = new CosmosClient({
    endpoint: TEST_COSMOS_URL || '',
    key: TEST_COSMOS_KEY || ''
  })

  // empty trees container
  const treesContainer = cosmosClient.database('sengi').container('trees')
  // console.log('reading existing trees')
  const treeDocsResult = await treesContainer.items.readAll().fetchAll()
  if (treeDocsResult.resources.length > MAX_ITEMS_TO_DELETE) {
    throw new Error(`Container trees has ${treeDocsResult.resources.length} items.  Max that can be deleted is ${MAX_ITEMS_TO_DELETE}.`)
  }
  for (const treeDoc of treeDocsResult.resources) {
    // console.log('deleting tree ' + treeDoc.id)
    await treesContainer.item(treeDoc.id as string, treeDoc.id).delete()
  }

  // empty treePacks container
  const treePacksContainer = cosmosClient.database('sengi').container('treePacks')
  // console.log('reading existing tree packs')
  const treePackDocsResult = await treePacksContainer.items.readAll().fetchAll()
  if (treePackDocsResult.resources.length > MAX_ITEMS_TO_DELETE) {
    throw new Error(`Container treePacks has ${treePackDocsResult.resources.length} items.  Max that can be deleted is ${MAX_ITEMS_TO_DELETE}.`)
  }
  for (const treePackDoc of treePackDocsResult.resources) {
    // console.log('deleting treePack ' + treePackDoc.id)
    await treePacksContainer.item(treePackDoc.id as string, treePackDoc.environment).delete()
  }

  // populate trees container
  const trees: DocRecord[] = [
    { id: '01', docType: 'tree', name: 'ash', heightInCms: 210, docVersion: 'not_used', docOpIds: [] },
    { id: '02', docType: 'tree', name: 'beech', heightInCms: 225, docVersion: 'not_used', docOpIds: [] },
    { id: '03', docType: 'tree', name: 'pine', heightInCms: 180, docVersion: 'not_used', docOpIds: [] }
  ]
  // console.log('populating trees')
  for (const tree of trees) {
    // console.log('uploading tree ' + tree.id)
    await treesContainer.items.upsert(tree)
  }

  // populate treePacks container
  const treePacks: DocRecord[] = [
    { id: '01', docType: 'treePack', name: 'ash', environment: 'forest', heightInCms: 210, docVersion: 'not_used', docOpIds: [] },
    { id: '02', docType: 'treePack', name: 'beech', environment: 'forest', heightInCms: 225, docVersion: 'not_used', docOpIds: [] },
    { id: '03', docType: 'treePack', name: 'palm', environment: 'tropical', heightInCms: 180, docVersion: 'not_used', docOpIds: [] },
    { id: '04', docType: 'treePack', name: 'coconut', environment: 'tropical', heightInCms: 175, docVersion: 'not_used', docOpIds: [] }
  ]
  // console.log('populating tree packs')
  for (const treePack of treePacks) {
    // console.log('uploading treePack ' + treePack.id)
    await treePacksContainer.items.upsert(treePack)
  }
}

async function readContainer (containerName: string): Promise<Record<string, unknown>[]> {
  const cosmosClient = new CosmosClient({
    endpoint: TEST_COSMOS_URL || '',
    key: TEST_COSMOS_KEY || ''
  })

  const docsResult = await cosmosClient.database('sengi').container(containerName).items.readAll().fetchAll()

  return docsResult.resources
}

beforeEach(async () => {
  jest.setTimeout(30 * 1000) // 30 secs - first run can be slow
  await initDb()
})

test('A document can be deleted.', async () => {
  const docStore = createCosmosDbDocStore()

  await expect(docStore.deleteById('tree', 'trees', '03', {}, {})).resolves.toEqual({ code: DocStoreDeleteByIdResultCode.DELETED })

  await expect(readContainer('trees')).resolves.toHaveLength(2)
})

test('A non-existent document can be deleted without error.', async () => {
  const docStore = createCosmosDbDocStore()

  await expect(docStore.deleteById('tree', 'trees', '200', {}, {})).resolves.toEqual({ code: DocStoreDeleteByIdResultCode.NOT_FOUND })
  
  await expect(readContainer('trees')).resolves.toHaveLength(3)
})

test('A document can be deleted from a container where the partition key value is not known.', async () => {
  const docStore = createCosmosDbDocStore()

  // getPartitionKeyFunc will return, forcing the partition key to be looked up.
  await expect(docStore.deleteById('treePack', 'treePacks', '03', {}, {})).resolves.toEqual({ code: DocStoreDeleteByIdResultCode.DELETED })

  await expect(readContainer('treePacks')).resolves.toHaveLength(3)
})

test('A document can be found to exist.', async () => {
  const docStore = createCosmosDbDocStore()

  await expect(docStore.exists('tree', 'trees', '02', {}, {})).resolves.toEqual({ found: true })
})

test('A non-existent document is not found.', async () => {
  const docStore = createCosmosDbDocStore()

  await expect(docStore.exists('tree', 'trees', '202', {}, {})).resolves.toEqual({ found: false })
})

test('A document can be fetched.', async () => {
  const docStore = createCosmosDbDocStore()

  await expect(docStore.fetch('tree', 'trees', '02', {}, {})).resolves.toEqual({
    doc: expect.objectContaining({ id: '02', docType: 'tree', name: 'beech', heightInCms: 225, docVersion: expect.any(String), docOpIds: [] })
  })
})

test('A non-existent document cannot be fetched.', async () => {
  const docStore = createCosmosDbDocStore()

  await expect(docStore.fetch('tree', 'trees', '202', {}, {})).resolves.toEqual({ doc: null })
})

test('A document can be fetched from a container with an unknown partition key.', async () => {
  const docStore = createCosmosDbDocStore()

  // getPartitionKeyFunc will return, forcing the partition key to be looked up.
  await expect(docStore.fetch('treePack', 'treePacks', '02', {}, {})).resolves.toEqual({
    doc: expect.objectContaining({ id: '02', docType: 'treePack', name: 'beech', environment: 'forest', heightInCms: 225, docVersion: expect.any(String), docOpIds: [] })
  })
})

test('A sql query can be executed.', async () => {
  const docStore = createCosmosDbDocStore()

  await expect(docStore.query('tree', 'trees', { sqlQuery: 'SELECT VALUE COUNT(1) FROM Docs d' }, {}, {})).resolves.toEqual({
    data: {
      sqlQueryResult: expect.objectContaining({
        resources: [3]
      })
    }
  })
})

test('An empty query can be executed.', async () => {
  const docStore = createCosmosDbDocStore()

  await expect(docStore.query('tree', 'trees', {}, {}, {})).resolves.toEqual({ data: {} })
})


test('All documents of a type can be selected.', async () => {
  const docStore = createCosmosDbDocStore()

  const result = await docStore.selectAll('tree', 'trees', ['id'], {}, {})
  const sortedDocs = result.docs.sort((a, b) => (a.id as string).localeCompare(b.id as string))
  expect(sortedDocs).toEqual([{ id: '01' }, { id: '02' }, { id: '03' }])
})

test('All documents of a type can be retrieved in pages.', async () => {
  const docStore = createCosmosDbDocStore()

  const result = await docStore.selectAll('tree', 'trees', ['id'], {}, { limit: 2 })
  expect(result.docs).toHaveLength(2)

  const result2 = await docStore.selectAll('tree', 'trees', ['id'], {}, { limit: 2, offset: 2 })
  expect(result2.docs).toHaveLength(1)
})

test('Select documents using a filter.', async () => {
  const docStore = createCosmosDbDocStore()

  const result = await docStore.selectByFilter('treePack', 'treePacks', ['id'], { whereClause: 'd.heightInCms > 200' }, {}, {})
  expect(result.docs).toHaveLength(2)
  expect(result.docs.findIndex(d => d.id === '01')).toBeGreaterThanOrEqual(0)
  expect(result.docs.findIndex(d => d.id === '02')).toBeGreaterThanOrEqual(0)
})

test('Select documents using a filter and paging.', async () => {
  const docStore = createCosmosDbDocStore()

  const result = await docStore.selectByFilter('tree', 'trees', ['id'], { whereClause: 'd.heightInCms > 200' }, {}, { limit: 1, offset: 1 })
  expect(result.docs).toHaveLength(1)
  expect(result.docs.findIndex(d => ['01', '02'].includes(d.id as string))).toBeGreaterThanOrEqual(0)
})

test('Select documents using ids.', async () => {
  const docStore = createCosmosDbDocStore()

  const result = await docStore.selectByIds('tree', 'trees', ['id', 'name', 'docVersion'], ['02', '03'] , {}, {})
  expect(result.docs).toHaveLength(2)
  expect(result.docs.find(d => d.id === '02')).toEqual({ id: '02', name: 'beech', docVersion: expect.any(String) })
  expect(result.docs.find(d => d.id === '03')).toEqual({ id: '03', name: 'pine', docVersion: expect.any(String) })
})

test('Select documents using ids that appear multiple times.', async () => {
  const docStore = createCosmosDbDocStore()

  const result = await docStore.selectByIds('tree', 'trees', ['name'], ['02', '03', '03', '02'] , {}, {})
  expect(result.docs).toHaveLength(2)
  expect(result.docs.find(d => d.name === 'beech')).toEqual({ name: 'beech' })
  expect(result.docs.find(d => d.name === 'pine')).toEqual({ name: 'pine' })
})

test('Insert a new document and rely on doc store to generate doc version.', async () => {
  const docStore = createCosmosDbDocStore()

  // docVersion will be stripped out before upsert
  const doc: DocRecord = { id: '04', docType: 'tree', name: 'oak', heightInCms: 150, docVersion: 'ignore_me', docOpIds: [] }
  await expect(docStore.upsert('tree', 'trees', doc, {}, {})).resolves.toEqual({ code: DocStoreUpsertResultCode.CREATED })

  const contents = await readContainer('trees')
  expect(contents).toHaveLength(4)
  expect(contents.find(d => d.id === '04')).toEqual(expect.objectContaining({
    id: '04', docType: 'tree', name: 'oak', heightInCms: 150, _etag: expect.any(String)
  }))
})

test('Update an existing document.', async () => {
  const docStore = createCosmosDbDocStore()

  const doc: DocRecord = { id: '03', docType: 'tree', name: 'palm', heightInCms: 123, docVersion: 'not_used', docOpIds: [] }
  await expect(docStore.upsert('tree', 'trees', doc, {}, {})).resolves.toEqual({ code: DocStoreUpsertResultCode.REPLACED })

  const contents = await readContainer('trees')
  expect(contents).toHaveLength(3)
  expect(contents.find(d => d.id === '03')).toEqual(expect.objectContaining({
    id: '03', docType: 'tree', name: 'palm', heightInCms: 123, _etag: expect.any(String)
  }))
})

test('Update an existing document with a required version.', async () => {
  const docStore = createCosmosDbDocStore()

  const initialContents = await readContainer('trees')
  const reqVersion = (initialContents.find(d => d.id === '03') || {})._etag as string

  const doc: DocRecord = { id: '03', docType: 'tree', name: 'palm', heightInCms: 123, docVersion: 'not_used', docOpIds: [] }
  await expect(docStore.upsert('tree', 'trees', doc, {}, { reqVersion })).resolves.toEqual({ code: DocStoreUpsertResultCode.REPLACED })

  const contents = await readContainer('trees')
  expect(contents).toHaveLength(3)
  expect(contents.find(d => d.id === '03')).toEqual(expect.objectContaining({
    id: '03', docType: 'tree', name: 'palm', heightInCms: 123, _etag: expect.any(String)
  }))
})

test('Fail to update an existing document if the required version is unavailable.', async () => {
  const docStore = createCosmosDbDocStore()

  const doc: DocRecord = { id: '03', docType: 'tree', name: 'palm', heightInCms: 123, docVersion: 'not_used', docOpIds: [] }
  await expect(docStore.upsert('tree', 'trees', doc, {}, { reqVersion: 'bbbb' })).resolves.toEqual({ code: DocStoreUpsertResultCode.VERSION_NOT_AVAILABLE })

  const contents = await readContainer('trees')
  expect(contents).toHaveLength(3)
  expect(contents.find(d => d.id === '03')).toEqual(expect.objectContaining({
    id: '03', docType: 'tree', name: 'pine', heightInCms: 180, _etag: expect.any(String)
  }))
})
