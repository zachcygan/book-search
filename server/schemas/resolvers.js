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
    saveBook: async (parent, { input }, { user }) => {
      try {
        const updatedUser = await User.findOneAndUpdate(
          { _id: user._id },
          { $addToSet: { savedBooks: input } },
          { new: true, runValidators: true }
        );

        if (!updatedUser) {
          throw new Error("User not found");
        }

        return updatedUser;
      } catch (err) {
        throw new Error(err.message);
      }
    },
    // Delete a book from a user's `savedBooks`
    removeBook: async (parent, { bookId }, { user }) => {
      try {
        const updatedUser = await User.findOneAndUpdate(
          { _id: user._id },
          { $pull: { savedBooks: { bookId: bookId } } },
          { new: true }
        );

        if (!updatedUser) {
          throw new Error("User not found");
        }

        return updatedUser;
      } catch (err) {
        throw new Error(err.message);
      }
    },
  },
};

module.exports = resolvers;
