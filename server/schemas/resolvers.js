const { AuthenticationError } = require('apollo-server-express');
const { User } = require('../models');
const { signToken } = require('../utils/auth');

const resolvers = {
    Query: {
        me: async (parent, args, context) => {
            if (context.user) {
                const userData = await User.fineOne({ _id: context.user._id })
                    .select('-__v -password')
                    .populate('savedBooks');

                return userData;
            }

            throw new AuthenticationError('Not logged in');
        },
    },

    Mutation: {
        login: async (parent, { email, password }) => {
            const user = await User.findOne({ email });

            if (!user) {
                throw new AuthenticationError('Wrong email or password');
            }

            const correctPw = await user.isCorrectPassword(password);

            if (!correctPw) {
                throw new AuthenticationError('Wrong email or password');
            }

            const token = signToken(user);
            return { token, user };
        },
        addUser: async (parent, args) => {
            const user = await User.create(args);
            const token = signToken(user)

            return { token, user };
        },
        saveBook: async (parent, args, context) => {
            if (context.user) {
                const user = await User.fineByIdAndUpdate(
                    { _id: context.user._id },
                    { $push: { savedBooks: { args } } },
                    { new: true }
                );
                return user;
            }
            throw new AuthenticationError('You need to be logged in')
        },
        removeBook: async (parent, {bookId}, context) => {
            if (context.user) {
                const user = await User.fineOneAndUpdate(
                    { _id: context.user._id },
                    { $pull : { savedBooks: {bookId: bookId }}},
                    { new: true }
                )
                return user;
            }
            throw new AuthenticationError('You need to be logged in')
        }
    }
};

module.exports = resolvers;