let envPath = __dirname + "/../.env"
require('dotenv').config({path:envPath});
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../server');
let User = require('../users');
chai.should();

chai.use(chaiHttp);

let login_details = {
    name: 'test',
    username: 'email@email.com',
    password: '123@abc'
}

describe('Register, Login and Call Test Collection with Basic Auth and JWT Auth', () => {
   beforeEach((done) => { //Before each test initialize the database to empty
       done();
    })

    after((done) => { //after this test suite empty the database
        User.deleteOne({name: 'test'}, function(err, user) {
            if(err) throw err;
        });
        done();
    })

    //Test the GET route
    describe('/signup', () => {
        it('it should register, login and check our token', (done) => {
          chai.request(server)
              .post('/signup')
              .send(login_details)
              .end((err, res) => {
                res.should.have.status(200);
                res.body.success.should.be.eql(true);
                //follow-up to get the JWT token
                chai.request(server)
                    .post('/signin')
                    .send(login_details)
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.body.should.have.property('token');
                        let token = res.body.token;
                        console.log(token);
                        done();
                    })
              })
        })
    });
});
