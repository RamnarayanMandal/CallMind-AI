import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Document } from 'mongoose';
import { User, UserDocument } from '../auth/schemas/user.schema';
import { Subscription } from '../subscription/schemas/subscription.schema';
import { Agent, AgentDocument } from '../agent/schemas/agent.schema';

type SubscriptionDocument = Subscription & Document;

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Subscription.name) private subscriptionModel: Model<SubscriptionDocument>,
    @InjectModel(Agent.name) private agentModel: Model<AgentDocument>,
  ) {}

  async getDashboardStats() {
    const [totalUsers, totalAgents, activeSubscriptions] = await Promise.all([
      this.userModel.countDocuments(),
      this.agentModel.countDocuments(),
      this.subscriptionModel.countDocuments({ status: 'active' }),
    ]);

    return {
      totalUsers,
      totalAgents,
      activeSubscriptions,
      systemHealth: 'Healthy',
    };
  }

  async getAnalytics() {
    const subStats = await this.subscriptionModel.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: null, totalMinutesUsed: { $sum: '$minutesUsed' } } }
    ]);

    const userGrowth = await this.userModel.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$_id' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 30 }
    ]);

    return {
      totalMinutesUsed: subStats[0]?.totalMinutesUsed || 0,
      userGrowth: userGrowth.map(u => ({ date: u._id, users: u.count }))
    };
  }

  async getUsers() {
    return this.userModel.find().select('-password -__v').exec();
  }

  async getSubscriptions() {
    return this.subscriptionModel.find().populate('planId').exec();
  }
}
