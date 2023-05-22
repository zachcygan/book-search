const { User } = require('../models');
const { signToken } = require('../utils/auth');

const resolvers = {
  Query: {
    // Get a single user by ID or username
    user: async (parent, { id, username }) => {
      try {
        const user = await User.findOne({
          $or: [{ _id: id }, { username: username }],
        });

        if (!user) {
          throw new Error('User not found');
        }

        return user;
      } catch (err) {
        throw new Error(err.message);
      }
    },
  },
  Mutation: {
    // Create a new user
    createUser: async (parent, { input }) => {
      try {
        const user = await User.create(input);

        if (!user) {
          throw new Error('Something went wrong');
        }

        const token = signToken(user);

        return { token, user };
      } catch (err) {
        throw new Error(err.message);
      }
    },
    // Login a user
    login: async (parent, { input }) => {
      try {
        const { username, email, password } = input;
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
    deleteBook: async (parent, { bookId }, { user }) => {
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
