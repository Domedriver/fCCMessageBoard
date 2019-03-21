/*
*
*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*       (if additional are added, keep them at the very end!)
*/

var chaiHttp = require('chai-http');
var chai = require('chai');
var assert = chai.assert;
var server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {
  
  var test_thread_id;
  var test_thread_id2;
  var test_reply_id;
  var test_reply_id2;

  suite('API ROUTING FOR /api/threads/:board', function() {
    
    
    suite('POST', function() {
      test('POST new thread to board', function(done) {
        chai.request(server)
          .post('/api/threads/testBoard')
          .send({
                text: 'This is text for test',
                delete_password: 'deletePassword',
                })
          .end(function(err, res) {
            assert.equal(res.status, 200)
            assert.isObject(res.body)            
            done()
          })        
      })       
    });
    
    
    suite('GET', function() {
      test('GET an array of threads corresponding to message board', function(done) {
        chai.request(server)
          .get('/api/threads/testBoard')
          .end(function(err, res) {
            assert.equal(res.status, 200)
            assert.isArray(res.body)
            assert.isAtMost(res.body.length, 10)
            assert.isAtMost(res.body[0].replies.length, 3)
            assert.equal(res.body[0].board, 'testBoard')
            assert.equal(res.body[0].thread_text, 'This is text for test')
            assert.property(res.body[0], 'created_on')
            assert.property(res.body[0], 'bumped_on')            
            assert.property(res.body[0], 'replycount')
            assert.notProperty(res.body[0], 'reported')
            assert.notProperty(res.body[0], 'delete_password')
            test_thread_id = res.body[0]._id
            test_thread_id2 = res.body[1]._id
            done()
          })
      })
      
    });
    
    suite('DELETE', function() {
      test('Delete thread with correct password', function(done) {
        chai.request(server)
          .delete('/api/threads/testBoard')          
          .send({thread_id: test_thread_id, delete_password: 'deletePassword'})
          .end(function(err, res) {
            assert.equal(res.status, 200)
            assert.equal(res.text, 'Success!')
            done()
          })
      })
      
      test('Delete thread with wrong password', function(done) {
        chai.request(server)
          .delete('/api/threads/testBoard')          
          .send({thread_id: test_thread_id2, delete_password: 'wrongPassword'})
          .end(function(err, res) {
            assert.equal(res.status, 200)
            assert.equal(res.text, 'Incorrect Password')
            done()
          })
      })
      
      test('Delete thread with wrong ID', function(done) {
        chai.request(server)
          .delete('/api/threads/testBoard')          
          .send({thread_id: 123456, delete_password: 'wrongPassword'})
          .end(function(err, res) {
            assert.equal(res.status, 200)
            assert.equal(res.text, 'Invalid ID')
            done()
          })
      })     
    });
    
    
    suite('PUT', function() {
      test('Report a thread', function(done) {
        chai.request(server)
          .put('/api/threads/testBoard')
          .send({thread_id: test_thread_id})
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'Success!')
            done()
          })
      })      
    });
  });
  
  suite('API ROUTING FOR /api/replies/:board', function() {
    
    suite('POST', function() {
      test('Post a replies to a thread on a board', function(done) {
        chai.request(server)
          .post('/api/replies/testBoard')
          .send({
                  text: 'This is a reply to test',
                  thread_id: test_thread_id2,
                  delete_password: 'deleteReplyPassword'                  
                })
          .end(function(err, res) {
            assert.equal(res.status, 200)
            done()
          })
      })      
    });
    
    suite('GET', function() {
      test('Get thread with all replies. Do not show password nor reported fields', function(done) {
        chai.request(server)
          .get('/api/replies/testBoard')
          .query({thread_id: test_thread_id2})
          .end(function(err, res) {
            assert.equal(res.status, 200)
            test_reply_id = res.body.replies[0]._id
            test_reply_id2 = res.body.replies[1]._id            
            done()
          })
      })      
    });
    
    suite('PUT', function() {
      test('Report a thread reply', function(done) {
        chai.request(server)
          .put('/api/replies/testBoard')
          .send({thread_id: test_thread_id2, reply_id: test_reply_id})
          .end(function(err, res) {
            assert.equal(res.text, 'Success!')
            done()
          })
      })      
    });
    
    suite('DELETE', function() {
      test('Delete a reply to a thread with correct password', function(done) {
        chai.request(server)
          .delete('/api/replies/testBoard')
          .send({reply_id: test_reply_id, delete_password: 'deleteReplyPassword'})
          .end(function(err, res) {
            assert.equal(res.status, 200)
            assert.equal(res.text, 'Success!')
            done()
          })        
      })
      
      test('Delete a reply to a thread with incorrect password', function(done) {
        chai.request(server)
          .delete('/api/replies/testBoard')
          .send({reply_id: test_reply_id2, delete_password: 'wrongPassword'})
          .end(function(err, res) {
            assert.equal(res.status, 200)
            assert.equal(res.text, 'Incorrect Password')
            done()
          })        
      })
    });
  
  });
});
