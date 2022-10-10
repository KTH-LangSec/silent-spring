describe("draft", function () {
  var draft  = require('../')
    , assert = require('assert')
    , Schema = draft.Schema
    , Model  = draft.Model

  describe("draft(descriptor, options)", function () {
    it("Should accept an object as a descriptor and an object of options", function () {
      var User = draft({ name: String, email: String })
        , Post = draft({ owner: Object, content: String })

      var werle = new User({ name: 'werle', email: 'joseph@werle.io' })
        , post  = new Post({ owner: werle, content: "I like draft :)"})

      assert.ok(werle.name === 'werle');
      assert.ok(werle.email === 'joseph@werle.io');

      assert.ok(post.owner === werle);
      assert.ok(post.content === "I like draft :)");
    });
  });

  describe("Schema", function () {
    describe("Should only accept a plain object or undefined as an argument", function () {
      it("Should accept a 'undefined'", function () {
        assert.doesNotThrow(function () { new Schema(undefined); }, TypeError); 
      });

      it("Should not accept a 'null'", function () {
        assert.throws(function () { new Schema(null); }, TypeError);
      });

      it("Should not accept a 'number'", function () {
        assert.throws(function () { new Schema(1); }, TypeError);
      });

      it("Should not accept a 'boolean'", function () {
        assert.throws(function () { new Schema(true); }, TypeError);
      });

      it("Should not accept a 'function'", function () {
        assert.throws(function () { new Schema(function () {}); }, TypeError);
      });

      it("Should not accept a 'date'", function () {
        assert.throws(function () { new Schema(new Date); }, TypeError);
      });

      it("Should not accept a constructed object", function () {
        var Thing = function Thing (arg) {}, thing = new(Thing);
        assert.throws(function () { new Schema(thing); }, TypeError);
      });

      it("Should accept a plain object", function () {
        assert.doesNotThrow(function () { new Schema({ property: String }); });
      });
    });

    describe("Should define a tree instance after instantiation", function () {
      var schema

      it("Should set the constructor on a property => type definition", function () { 
        schema = new Schema({ property: String });
        assert.ok(schema.tree.property.Constructor === String);
      });

      it("Should set the constructor on a property who's type is set on an object descriptor", function () {
        schema = new Schema({ property: {type: String } });
        assert.ok(schema.tree.property.Constructor === String);
      });

      it("Should define child tree schema", function () {
        schema = new Schema({
          name : String,
          profile : {
            age     : Number,
            gender  : String,
            parents : {
              mother : { name : String },
              father : { name : String }
            }
          },
          parents : Function
        });


        assert.ok(typeof schema.tree.profile === 'object', "Failed to create child tree object .profile");
        assert.ok(typeof schema.tree.profile.parents === 'object', "Failed to create child tree object .profile.parents");
        assert.ok(typeof schema.tree.profile.parents.mother === 'object', "Failed to create child tree object .profile.parents.mother");
        assert.ok(typeof schema.tree.profile.parents.father === 'object', "Failed to create child tree object .profile.parents.father");

        assert.ok(schema.tree.name.Constructor === String, "Failed setting .name on tree");
        assert.ok(schema.tree.profile.age.Constructor === Number, "Failed to create .tree.profile type");
        assert.ok(schema.tree.profile.gender.Constructor === String, "Failed to create .profile.gender type");
        assert.ok(schema.tree.profile.parents.mother.name.Constructor === String, "Failed to create .profile.parents.mother.name type");
        assert.ok(schema.tree.profile.parents.father.name.Constructor === String, "Failed to create .profile.parents.father.name type");

        var Person = schema.createModel();
        var joe = new Person({
          parents : function () {
            var parents = this.profile.parents
              , names = []
            for (var parent in parents) {
              names.push(parents[parent].name)
            }
            return names;
          },
          name : 'Joe',
          profile : {
            age : 22,
            gender : 'male',
            parents : {
              mother : {name: 'Cherie'},
              father : {name: 'Keith'}
            }
          }
        });

        assert.ok(!!~joe.parents().indexOf(joe.profile.parents.mother.name));
        assert.ok(!!~joe.parents().indexOf(joe.profile.parents.father.name));
      });
    });

    describe('#add', function () {
      it("Should accept a key and a descriptor object", function () {
        schema = new Schema();
        schema.add('name', String);
        schema.add('age', { type: Number });
        assert.ok(schema.tree.name.Constructor === String);
        assert.ok(schema.tree.age.Constructor === Number);
      });
    });

    describe('#createModel', function () {
      it("Should create a Model constructor from the defined schema", function () {
        var schema, User, user
        schema = new Schema();
        schema.add('name', String);
        schema.add('uuid', {type: String, default: 'anon'})
        schema.add('last_updated', {type: Number, default: Date.now})
        schema.add('profile', { 
          age: Number, 
          gender: { 
            type: String,
            strict : false,
            get: function (value) { return value; }, 
            set: function(value) {  return value; },
            enum: ['male', 'female', 'other'] 
        }});

        User = schema.createModel();
        user = new User( {name : 'Joe', profile: { age: 22, gender: 'male' }} );

        assert.ok(Model.prototype.isPrototypeOf(User.prototype));
        assert.ok(user.name);
        assert.ok(user.profile);
        assert.ok(user.profile.age);
        assert.ok(user.profile.gender);
        assert.ok(user.uuid === 'anon');
        assert.ok(user.last_updated  -2 <= Date.now())
      });
    });
  });

  describe(".createModel .createSchema", function () {
    it("Should be able to create models and schemas and allow later changes to propagate", function () {
      var UserSchema, PostSchema, User, Post, werle, post
      // define the user schema
      UserSchema = draft.createSchema({ name: String, email: String, networks: [Object] });
      // create the model for use in the post schema
      User = UserSchema.createModel();
      // create the post schema to add to the user schema
      PostSchema = draft.createSchema({ owner: User, content: String });
      // add profile object with friends collection set to User type
      UserSchema.add({ profile: { friends: [User] }});
      // create Post model
      Post = PostSchema.createModel();
      // add posts collection to user schema and use Post model as type
      UserSchema.add({ posts: [Post] });
      // create post owned by 'werle'
      post  = new Post({ owner: werle, content: "I like draft :)"});
      // create 'werle' user
      werle = new User({ name: 'werle', email: 'joseph@werle.io', posts: [post] });
      // push post to user object
      werle.posts.push(post);
    });
  });
});
