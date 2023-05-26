const { AuthenticationError } = require('apollo-server-express');
const { User } = require('../models');
const { signToken } = require('../utils/auth');

const resolvers = {
  Query: {
    // Get a single user by ID or username
    me: async (parent, args, context) => {
      
        if (context.user) {
          const user = await User.findOne({
            _id: context.user._id,
          })
          .select('-__v -password');

          return user
        } 
        throw new AuthenticationError('You need to be logged in!');
    },
  },
  Mutation: {
    // Create a new user
    addUser: async (parent, args) => {
        const user = await User.create(args);

        const token = signToken(user);

        return { token, user };
    },
    // Login a user
    login: async (parent, args) => {
      try {
        const { username, email, password } = args;
        const user = await User.findOne({ $or: [{ username }, { email }] });

        if (!user) {
          throw new Error("User not found");
        }

        const correctPw = await user.isCorrectPassword(password);

        if (!correctPw) {
          throw new Error('Incorrect password');
        }

        const token = signToken(user);

        return { token, user };
      } catch (err) {
        throw new Error(err.message);
      }
    },
    // Save a book to a user's `savedBooks`
    saveBook: async (parent, { input }, context) => {

      if (context.user) {
        const updatedUser = await User.findByIdAndUpdate(
          { _id: context.user._id },
          { $push: { savedBooks: input }},
          { new: true }
        );
        return updatedUser;
      }
      throw new AuthenticationError('You need to be logged in!');
    },
    // Delete a book from a user's `savedBooks`
    removeBook: async (parent, { bookId }, context) => {
      if (context.user) {
        const updatedUser = await User.findByIdAndUpdate(
          { _id: context.user._id },
          { $pull: { savedBooks: { bookId }}},
          { new: true }
        );
        return updatedUser;
      }
      throw new AuthenticationError('You need to be logged in!');
    },
  },
};

module.exports = resolvers;
