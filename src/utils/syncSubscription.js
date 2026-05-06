import Subscription from "../models/subscription.model.js";
import User from "../models/user.model.js";

/**
 * Single source of truth for activating a subscription on a user.
 */
export const activatePlatformSubscription = async (
  userId,
  { startDate, endDate },
) => {
  await User.findByIdAndUpdate(userId, {
    isSubscribed: true,
    subscriptionStartDate: startDate,
    subscriptionEndDate: endDate,
  });
};

/**
 * Deactivates a user's platform subscription in both User and Subscription collections.
 * @param {string|ObjectId} userId
 * @param {string|ObjectId} [subscriptionId] — optional, deactivates all if omitted
 */
export const deactivatePlatformSubscription = async (
  userId,
  subscriptionId = null,
) => {
  const subFilter = subscriptionId
    ? { _id: subscriptionId }
    : { user: userId, isActive: true };

  const sub = await Subscription.updateMany(subFilter, {
    $set: {
      isActive: false,
      canceled: true,
      canceledAt: new Date(),
    },
  });
};

/**
 * Cancels a user's platform subscription so it does not renew, but keeps it active until expiry.
 * @param {string|ObjectId} userId
 * @param {string|ObjectId} [subscriptionId]
 */
export const cancelPlatformSubscription = async (
  userId,
  subscriptionId = null,
) => {
  const subFilter = subscriptionId
    ? { _id: subscriptionId }
    : { user: userId, isActive: true };

  await Subscription.updateMany(subFilter, {
    $set: {
      isActive: false,
      canceled: true,
      canceledAt: new Date(),
    },
  });
};

/**
 * Activates a bootcamp subscription for a user.
 */
export const activateBootcampSubscription = async (userId, bootcampId) => {
  await User.findByIdAndUpdate(userId, {
    $addToSet: { bootcamps: bootcampId }, // addToSet prevents duplicates
  });
};

/**
 * Deactivates a bootcamp subscription for a user.
 */
export const deactivateBootcampSubscription = async (
  userId,
  bootcampId,
  subscriptionId,
) => {
  await Promise.all([
    Subscription.findByIdAndUpdate(subscriptionId, {
      $set: { isActive: false },
    }),
    User.findByIdAndUpdate(userId, {
      $pull: { bootcamps: bootcampId },
    }),
  ]);
};
