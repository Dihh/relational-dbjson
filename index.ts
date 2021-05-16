import express from 'express';
import { control } from './controlDB'

const app = express();
app.use(express.json());

async function execute(func, res, ...params) {
    try {
        const data = await control[func](params[0], params[1], params[2], params[3])
        res.json(data)
    } catch (err) {
        res.statusCode = 500;
        console.error(err)
        res.send(err.message)
    }
}

app.get('/:type', async (req, res) => {
    await execute('readType', res, req.params.type, req.query, null);
})

app.post('/:type', async (req, res) => {
    await execute('create', res, req.params.type, req.body, null);
})

app.put('/:type', async (req, res) => {
    await execute('update', res, req.params.type, req.body, req.params.id, req.query);
})

app.put('/:type/:id', async (req, res) => {
    await execute('update', res, req.params.type, req.body, req.params.id);
})

app.patch('/:type', async (req, res) => {
    await execute('patch', res, req.params.type, req.body, req.params.id, req.query);
})

app.patch('/:type/:id', async (req, res) => {
    await execute('patch', res, req.params.type, req.body, req.params.id);
})

app.delete('/:type', async (req, res) => {
    await execute('delete', res, req.params.type, req.params.id, req.query);
})

app.delete('/:type/:id', async (req, res) => {
    await execute('delete', res, req.params.type, req.params.id, req.query);
})

app.get('/:type/:id', async (req, res) => {
    await execute('readTypeId', res, req.params.type, req.params.id, null);
})

app.get('/', async (req, res) => {
    await execute('readAll', res, null, null, null);
})

app.listen(3000)