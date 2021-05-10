import fs from 'fs';

export const control = {
    async readDb() {
        return new Promise((resolve, reject) => {
            fs.readFile('db.json', function (err, data) {
                if (err) reject();
                resolve(JSON.parse(data.toString()))
            });
        })
    },

    async writeDb(db) {
        return new Promise((resolve, reject) => {
            fs.writeFile('db.json', JSON.stringify(db, null, 4), function (err) {
                if (err) reject();
                resolve(true)
            });
        })
    },

    async readAll() {
        return await this.readDb();
    },

    async create(type, obj) {
        const db = await this.readDb();
        let elements = db[type] || { data: [], lastId: 0 }
        elements.lastId++;
        obj = { _id: elements.lastId, ...obj };
        elements.data.push(obj);
        db[type] = elements
        await this.writeDb(db);
        return obj
    },

    async update(type, obj, id) {
        const db = await this.readDb();
        delete (obj._id)
        let elements = db[type]
        if (elements) {
            let elementId = elements.data.findIndex(el => el._id == id);
            if (elementId !== -1) {
                elements.data[elementId] = { ...elements.data[elementId], ...obj };
                db[type] = elements
                await this.writeDb(db);
                return elements.data[elementId]
            }
        }
    },

    async readType(type, params) {
        const db = await this.readDb();
        const page = Number.parseInt(params._page);
        delete (params._page);
        const limit = Number.parseInt(params._limit);
        delete (params._limit);
        const sort = params._sort;
        delete (params._sort);
        const order = params._order;
        delete (params._order);
        const q = params.q;
        delete (params.q);
        const join = params._join;
        delete (params._join);
        let results = db[type] ? db[type].data : [];
        if (q) {
            results = this.getByQuery(results, q)
        }
        if (params) {
            let lteParams = {};
            let gteParams = {};
            let neParams = {};
            let inParams = {};
            let ninParams = {};
            let likeParams = {};
            Object.keys(params).map(el => {
                const obj = {};
                if (el.endsWith('_lte')) {
                    obj[el.replace('_lte', '')] = params[el];
                    delete (params[el]);
                    lteParams = { ...lteParams, ...obj }
                }
                if (el.endsWith('_gte')) {
                    obj[el.replace('_gte', '')] = params[el];
                    delete (params[el]);
                    gteParams = { ...gteParams, ...obj }
                }
                if (el.endsWith('_ne')) {
                    obj[el.replace('_ne', '')] = params[el];
                    delete (params[el]);
                    neParams = { ...neParams, ...obj }
                }
                if (el.endsWith('_in')) {
                    obj[el.replace('_in', '')] = params[el].split(',');
                    delete (params[el]);
                    inParams = { ...inParams, ...obj }
                }
                if (el.endsWith('_nin')) {
                    obj[el.replace('_nin', '')] = params[el].split(',');
                    delete (params[el]);
                    ninParams = { ...ninParams, ...obj }
                }
                if (el.endsWith('_like')) {
                    obj[el.replace('_like', '')] = params[el];
                    delete (params[el]);
                    likeParams = { ...likeParams, ...obj }
                }
            })
            results = this.getByType(results, params, lteParams, gteParams, neParams, inParams, ninParams, likeParams);
        }
        if (sort) {
            results = this.getBySort(results, sort, order)
        }
        if (join) {
            results = this.join(results, join, db)
        }
        if (page) {
            results = this.getByPage(results, page, limit)
        }
        return results;
    },

    async readTypeId(type, id) {
        const db = await this.readDb();
        let results = db[type] ? db[type].data : [];
        return results.find(el => el._id == id);
    },

    join(results, joins, db) {
        let data = results
        joins = joins.split(',');
        joins.map(el => {
            const sub = el.split('.');
            data = data.map(element => {
                if (sub.length > 1) {
                    let obj = element;
                    sub.forEach(subs => {
                        if (obj) {
                            if (obj[`${subs}_id`]) {
                                if (db[subs]) {
                                    obj[subs] = db[subs].data.find(dbElement => (dbElement._id == obj[`${subs}_id`]))
                                }
                                delete (obj[`${subs}_id`])
                            } else {
                                obj = obj[subs]
                            }
                        }
                    });
                } else {
                    if (db[el]) {
                        element[el] = db[el].data.find(dbElement => (dbElement._id == element[`${el}_id`]))
                    }
                    delete (element[`${el}_id`])
                }
                return element;
            })
        })
        return data
    },

    getByQuery(results, q) {
        return results.map(el => {
            if (Object.keys(el).find(key => {
                return String(el[key]) == q
            })) {
                return el
            }
        }).filter(el => el)
    },

    getByType(results, params, lteParams, gteParams, neParams, inParams, ninParams, likeParams) {
        let data = results;
        data = this.filterParam(data, params);
        data = this.filterGreater(data, gteParams);
        data = this.filterLess(data, lteParams);
        data = this.filterNotEquals(data, neParams);
        data = this.filterIn(data, inParams);
        data = this.filterNin(data, ninParams);
        data = this.filterLike(data, likeParams);
        return data;
    },

    filterParam(results, params) {
        let data = results;
        Object.keys(params).map(key => {
            data = results.filter(el => {
                return el[key] == String(params[key])
            })
        })
        return data
    },

    filterGreater(results, params) {
        let data = results;
        Object.keys(params).map(key => {
            data = results.filter(el => {
                return el[key] > Number.parseInt(params[key])
            })
        })
        return data
    },

    filterLess(results, params) {
        let data = results;
        Object.keys(params).map(key => {
            data = results.filter(el => {
                return el[key] < Number.parseInt(params[key])
            })
        })
        return data
    },

    filterNotEquals(results, params) {
        let data = results;
        Object.keys(params).map(key => {
            data = results.filter(el => {
                return el[key] != String(params[key])
            })
        })
        return data
    },

    filterIn(results, params) {
        let data = results;
        Object.keys(params).map(key => {
            data = results.filter(el => {
                return params[key].find(value => {
                    return String(value) == el[key]
                })
            })
        })
        return data
    },

    filterNin(results, params) {
        let data = results;
        Object.keys(params).map(key => {
            data = results.filter(el => {
                return !params[key].find(value => {
                    return String(value) == el[key]
                })
            })
        })
        return data
    },

    filterLike(results, params) {
        let data = results;
        Object.keys(params).map(key => {
            data = results.filter(el => {
                return el[key].normalize('NFD').replace(/[\u0300-\u036f]/g, "").toLowerCase().includes(String(params[key]).normalize('NFD').replace(/[\u0300-\u036f]/g, "").toLowerCase())
            })
        })
        return data
    },

    getByPage(results, page, limit) {
        return {
            page,
            limit: limit || 10,
            totalRecords: results.length,
            totalPages: Math.ceil(results.length / (limit || 10)),
            records: results.slice((limit || 10) * (page - 1), (limit || 10) * page)
        }
    },

    getBySort(results, sort, order) {
        let data = results
        sort = sort.split(',')
        order = order || 'asc'
        order = order.split(',')
        sort = sort.length > 1 ? sort : sort.join('')
        order = order.length > 1 ? order : order.join('')
        if (Array.isArray(sort)) {
            data = this.sort(data, sort[0], order[0], sort, order)
        } else {
            data = this.sort(data, sort, order)
        }
        return data;
    },

    sort(results, key, order, keys = undefined, orders = undefined) {
        return results.sort((a, b) => {
            if (!a[key]) {
                return -1
            }
            if (a[key] < b[key]) {
                return order == 'desc' ? 1 : -1;
            }
            if (a[key] > b[key]) {
                return order == 'desc' ? -1 : 1;
            }
            if (keys) {
                for (let i = 1; i <= keys.length; i++) {
                    if (!a[keys[i]]) {
                        return -1
                    }
                    if (a[keys[i]] < b[keys[i]]) {
                        return orders[i] == 'desc' ? 1 : -1;
                    }
                    if (a[keys[i]] > b[keys[i]]) {
                        return orders[i] == 'desc' ? -1 : 1;
                    }
                }
            }
            return 0;
        })
    }
}