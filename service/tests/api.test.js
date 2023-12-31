const http = require('http');
const request = require('supertest');
//const app = "localhost:4000";
const app = http.createServer(require('../server.js'));

const finish = function(done) {
    return (err) => (err ? done(err) :  done());
}

const hasToken = function(res) {
    if(!'token' in res.body)
        throw new Error('missing token');
    return true;
}

const artistId = '12Chz98pHFMPJEknJQMWvI';
const albumId = '5qK8S5JRF8au6adIVtBsmk';

const username = 'test_user';
const password = 'test_pass';
let token = "";

beforeAll(async () => {
    let res;

    res = await request(app)
        .post('/api/login')
        .auth(username, password)

    if(res.status != 200) {
        res = await request(app)
            .post('/api/user')
            .auth(username, password)
            .expect(200)
    }

    token = res.body.token;
    expect(token);
})

let req = request.agent(app);

const setBearer = function() {
    return req.auth(token, { type: 'bearer' });
}

describe('Artist endpoint', () => {

    test('add and remove', async () => {
        let res;

        res = await setBearer()
            .put('/api/artists')
            .send({ artistId: artistId })
        expect(res.status).toEqual(200);

        res = await setBearer()
            .get('/api/artists');
        expect(res.status).toEqual(200);
        expect(res.body.length).toEqual(1);

        res = await setBearer()
            .delete('/api/artists')
            .send({ artistId: artistId });
        expect(res.status).toEqual(200);

        res = await setBearer()
            .get('/api/artists');
        expect(res.status).toEqual(204);

        res = await setBearer()
            .delete('/api/artists')
            .send({ artistId: 'not an id' });
        expect(res.status).toEqual(200);
        expect(res.body.success).toEqual(false);

        res = await setBearer()
            .put('/api/artists')
            .send({ artistId: 'not an id' })
        expect(res.status).toEqual(400);
        expect(res.body.error).toEqual('Invalid artistId');
    });
});

describe('Album endpoint', () => {
    const hasStatus = function(res, status) {
        return res.body.some((album) => {
            return album.albumId === albumId && album.status == status
        });
    };

    test('update album', async () => {
        let res;

        //populate data
        res = await setBearer()
            .put('/api/artists')
            .send({ artistId: artistId })
        expect(res.status).toEqual(200);

        res = await setBearer()
            .put('/api/albums')
            .send({ albumId: albumId, status: 'Visited' });
        expect(res.status).toEqual(200);

        res = await setBearer().get('/api/albums');
        expect(res.status).toEqual(200);
        expect(hasStatus(res, 'Visited'));

        res = await setBearer()
            .put('/api/albums')
            .send({ albumId: albumId, status: 'Checked' });
        expect(res.status).toEqual(200);

        res = await setBearer().get('/api/albums');
        expect(res.status).toEqual(200);
        expect(hasStatus(res, 'Checked'));

        res = await setBearer()
            .put('/api/albums')
            .send({ albumId: albumId, status: 'bad status' })
        expect(res.status).toEqual(400);
        expect(res.body.error).toEqual('Invalid status');

        res = await setBearer()
            .put('/api/albums')
            .send({ albumId: 'not an id', status: 'New Release' })
        expect(res.status).toEqual(400);
        expect(res.body.error).toEqual('Specified albumId does not exist');
    });
});

describe('Search endpoint', () => {
    test('search for an artist', (done) => {
        req
            .get('/api/search/Muse')
            .expect(200)
            .expect((res) => {
                res.body.some((item) => item.name === 'Muse')
            })
            .end(finish(done));
    });
});

describe('Login endpoint', () => {

    test('login', (done) => {
        req
            .post('/api/login')
            .auth(username, password)
            .expect(200)
            .expect(hasToken)
            .end(finish(done));
    });

    test('logout', (done) => {
        setBearer()
            .delete('/api/login')
            .expect(200)
            .end(() => {
                setBearer()
                    .get('/api/artists')
                    .expect(401)
                    .end(finish(done))
            });

    });
});

describe('User endpoint', () => {

    test('register new user', (done) => {
        req
            .post('/api/user')
            .auth('new_user', password)
            .expect(hasToken)
            .expect(200)
            .end(() => {
                request(app)
                    .post('/api/user')
                    .auth(username, password)
                    .expect(403)
                    .expect({ msg: 'Username taken' })
                    .end(finish(done));
            });
    });

    test('delete account', (done) => {
        setBearer()
            .delete('/api/user')
            .expect(200)
            .end(() => {
                setBearer()
                    .delete('/api/user')
                    .expect(401)
                    .end(finish(done));
            });
    });
});
