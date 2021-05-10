import express from 'express';
import { control } from './controlDB'

const app = express();
app.use(express.json());

app.get('/:type', async (req, res) => {
    res.json(await control.readType(req.params.type, req.query))
})

app.post('/:type', async (req, res) => {
    res.json(await control.create(req.params.type, req.body))
})

app.put('/:type/:id', async (req, res) => {
    res.json(await control.update(req.params.type, req.body, req.params.id))
})

app.patch('/:type/:id', async (req, res) => {
    res.json(await control.patch(req.params.type, req.body, req.params.id))
})

app.get('/:type/:id', async (req, res) => {
    res.json(await control.readTypeId(req.params.type, req.params.id))
})

app.get('/', async (req, res) => {
    res.json(await control.readAll())
})

app.listen(3000)