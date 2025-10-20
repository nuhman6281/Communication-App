import { DataSource } from 'typeorm';
import { User } from './modules/users/entities/user.entity';
import { Conversation } from './modules/conversations/entities/conversation.entity';
import { ConversationParticipant } from './modules/conversations/entities/conversation-participant.entity';
import { Message } from './modules/messages/entities/message.entity';
import * as bcrypt from 'bcrypt';
import { ConversationType, MessageType, UserRole } from './common/constants';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'postgres123',
  database: 'chatapp',
  entities: [
    __dirname + '/modules/**/*.entity{.ts,.js}',
    __dirname + '/common/entities/**/*.entity{.ts,.js}',
  ],
  synchronize: false,
});

async function seedData() {
  try {
    await AppDataSource.initialize();
    console.log('Database connected');

    const userRepo = AppDataSource.getRepository(User);
    const conversationRepo = AppDataSource.getRepository(Conversation);
    const participantRepo = AppDataSource.getRepository(ConversationParticipant);
    const messageRepo = AppDataSource.getRepository(Message);

    // Create sample users
    const passwordHash = await bcrypt.hash('password123', 10);

    const user1 = userRepo.create({
      email: 'alice@example.com',
      username: 'alice',
      firstName: 'Alice',
      lastName: 'Johnson',
      passwordHash,
      isVerified: true,
      isOnline: true,
      lastSeen: new Date(),
    });
    await userRepo.save(user1);
    console.log('Created user 1:', user1.id);

    const user2 = userRepo.create({
      email: 'bob@example.com',
      username: 'bob',
      firstName: 'Bob',
      lastName: 'Smith',
      passwordHash,
      isVerified: true,
      isOnline: false,
      lastSeen: new Date(Date.now() - 3600000),
    });
    await userRepo.save(user2);
    console.log('Created user 2:', user2.id);

    const user3 = userRepo.create({
      email: 'charlie@example.com',
      username: 'charlie',
      firstName: 'Charlie',
      lastName: 'Brown',
      passwordHash,
      isVerified: true,
      isOnline: true,
      lastSeen: new Date(),
    });
    await userRepo.save(user3);
    console.log('Created user 3:', user3.id);

    // Create conversation 1 (Alice <-> Bob)
    const conv1 = conversationRepo.create({
      type: ConversationType.DIRECT,
      createdById: user1.id,
      lastMessageAt: new Date(),
    });
    await conversationRepo.save(conv1);
    console.log('Created conversation 1:', conv1.id);

    // Add participants to conversation 1
    const conv1Part1 = participantRepo.create({
      conversationId: conv1.id,
      userId: user1.id,
      role: UserRole.MEMBER,
    });
    await participantRepo.save(conv1Part1);

    const conv1Part2 = participantRepo.create({
      conversationId: conv1.id,
      userId: user2.id,
      role: UserRole.MEMBER,
    });
    await participantRepo.save(conv1Part2);

    // Create conversation 2 (Alice <-> Charlie)
    const conv2 = conversationRepo.create({
      type: ConversationType.DIRECT,
      createdById: user1.id,
      lastMessageAt: new Date(Date.now() - 7200000),
    });
    await conversationRepo.save(conv2);
    console.log('Created conversation 2:', conv2.id);

    // Add participants to conversation 2
    const conv2Part1 = participantRepo.create({
      conversationId: conv2.id,
      userId: user1.id,
      role: UserRole.MEMBER,
    });
    await participantRepo.save(conv2Part1);

    const conv2Part2 = participantRepo.create({
      conversationId: conv2.id,
      userId: user3.id,
      role: UserRole.MEMBER,
    });
    await participantRepo.save(conv2Part2);

    // Create messages for conversation 1
    const msg1 = messageRepo.create({
      conversationId: conv1.id,
      senderId: user2.id,
      content: 'Hey Alice! How are you doing?',
      messageType: MessageType.TEXT,
      createdAt: new Date(Date.now() - 600000),
    });
    await messageRepo.save(msg1);

    const msg2 = messageRepo.create({
      conversationId: conv1.id,
      senderId: user1.id,
      content: "Hi Bob! I'm doing great, thanks for asking!",
      messageType: MessageType.TEXT,
      createdAt: new Date(Date.now() - 300000),
    });
    await messageRepo.save(msg2);

    const msg3 = messageRepo.create({
      conversationId: conv1.id,
      senderId: user2.id,
      content: "That's wonderful to hear!",
      messageType: MessageType.TEXT,
      createdAt: new Date(Date.now() - 60000),
    });
    await messageRepo.save(msg3);

    // Update conversation 1 last message
    conv1.lastMessageId = msg3.id;
    await conversationRepo.save(conv1);

    // Create messages for conversation 2
    const msg4 = messageRepo.create({
      conversationId: conv2.id,
      senderId: user3.id,
      content: 'Alice, did you see the latest update?',
      messageType: MessageType.TEXT,
      createdAt: new Date(Date.now() - 7200000),
    });
    await messageRepo.save(msg4);

    // Update conversation 2 last message
    conv2.lastMessageId = msg4.id;
    await conversationRepo.save(conv2);

    console.log('\n=== Sample Data Created Successfully! ===');
    console.log('\nTest User Credentials:');
    console.log('Email: alice@example.com');
    console.log('Password: password123');
    console.log('\nUser IDs:', [user1.id, user2.id, user3.id]);
    console.log('Conversation IDs:', [conv1.id, conv2.id]);
    console.log('\n*** IMPORTANT: First conversation UUID:', conv1.id, '***');

    await AppDataSource.destroy();
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seedData();
