import { placeholderImages } from './placeholder-images';

export type User = {
  id: string;
  name: string;
  role: 'client' | 'freelancer' | 'admin';
  avatar: string;
  email: string;
  studentVerified: boolean;
  skills: string[];
  rating: number;
  reviews: number;
};

export type Task = {
  id: string;
  title: string;
  description: string;
  budget: number;
  deadline: string;
  status: 'Open' | 'Assigned' | 'Completed' | 'Cancelled';
  clientId: string;
  freelancerId?: string;
  tags: string[];
};

export type Bid = {
  id: string;
  taskId: string;
  freelancerId: string;
  amount: number;
  proposal: string;
  timestamp: string;
};

export type Review = {
  id: string;
  taskId: string;
  reviewerId: string;
  revieweeId: string;
  rating: number;
  comment: string;
  timestamp: string;
};

export const users: User[] = [
  { id: 'user-1', name: 'Aarav Sharma', role: 'freelancer', avatar: placeholderImages.find(p => p.id === 'user1')?.imageUrl!, email: 'aarav.sharma@example.com', studentVerified: true, skills: ['React', 'Node.js', 'UI/UX Design'], rating: 4.8, reviews: 12 },
  { id: 'user-2', name: 'Sita Gurung', role: 'freelancer', avatar: placeholderImages.find(p => p.id === 'user2')?.imageUrl!, email: 'sita.gurung@example.com', studentVerified: false, skills: ['Graphic Design', 'Illustration', 'Branding'], rating: 4.9, reviews: 25 },
  { id: 'user-3', name: 'Rohan Thapa', role: 'client', avatar: placeholderImages.find(p => p.id === 'user3')?.imageUrl!, email: 'rohan.thapa@example.com', studentVerified: false, skills: [], rating: 5.0, reviews: 8 },
  { id: 'user-4', name: 'Priya Adhikari', role: 'freelancer', avatar: placeholderImages.find(p => p.id === 'user4')?.imageUrl!, email: 'priya.adhikari@example.com', studentVerified: true, skills: ['Content Writing', 'SEO', 'Translation'], rating: 4.7, reviews: 18 },
  { id: 'user-admin', name: 'Admin', role: 'admin', avatar: '/avatar.png', email: 'admin@kaamkokura.com', studentVerified: false, skills: [], rating: 0, reviews: 0 }
];

export const tasks: Task[] = [
  { 
    id: 'task-1', 
    title: 'Build a React Native E-commerce App', 
    description: 'We are looking for an experienced React Native developer to build a mobile app for our e-commerce store. The app should have features like product listing, cart, checkout, and payment integration with Khalti. UI/UX designs will be provided. The ideal candidate should have prior experience with similar projects.', 
    budget: 80000, 
    deadline: '2024-08-30', 
    status: 'Open', 
    clientId: 'user-3',
    tags: ['React Native', 'Mobile App', 'E-commerce']
  },
  { 
    id: 'task-2', 
    title: 'Logo Design for a new Cafe', 
    description: 'Need a creative logo for a new cafe opening in Pokhara. The theme is modern, minimalist, with a touch of local Nepali art. The final deliverables should include vector files and different color variations.', 
    budget: 5000, 
    deadline: '2024-07-25', 
    status: 'Assigned', 
    clientId: 'user-3',
    freelancerId: 'user-2',
    tags: ['Logo Design', 'Branding', 'Graphic Design']
  },
  { 
    id: 'task-3', 
    title: 'Write Blog Posts about Trekking in Nepal', 
    description: 'Seeking a writer to create 5 engaging blog posts (1000-1500 words each) about popular trekking routes in Nepal (e.g., Everest Base Camp, Annapurna Circuit). Must be SEO-friendly content.', 
    budget: 10000, 
    deadline: '2024-07-20', 
    status: 'Completed', 
    clientId: 'user-3',
    freelancerId: 'user-4',
    tags: ['Content Writing', 'SEO', 'Travel']
  },
  { 
    id: 'task-4', 
    title: 'Develop a simple WordPress website for a local hotel', 
    description: 'Create a responsive WordPress website for a small hotel. The site needs a home page, about page, gallery, and a contact/booking form. The theme will be provided.', 
    budget: 25000, 
    deadline: '2024-08-15', 
    status: 'Open', 
    clientId: 'user-3',
    tags: ['WordPress', 'Web Development', 'Hotel']
  }
];

export const bids: Bid[] = [
  { id: 'bid-1', taskId: 'task-1', freelancerId: 'user-1', amount: 75000, proposal: "I have 3+ years of experience in React Native and have built several e-commerce apps. I can deliver a high-quality, performant application within your deadline.", timestamp: '2024-07-10T10:00:00Z' },
  { id: 'bid-2', taskId: 'task-1', freelancerId: 'user-4', amount: 80000, proposal: "While my main expertise is writing, I have a partner who is a senior React Native developer. We can work together to deliver your project.", timestamp: '2024-07-10T11:30:00Z' },
  { id: 'bid-3', taskId: 'task-4', freelancerId: 'user-1', amount: 22000, proposal: "I am proficient in WordPress and can create a professional and responsive website for your hotel. I can start immediately.", timestamp: '2024-07-11T09:00:00Z' }
];

export const reviews: Review[] = [
  { id: 'review-1', taskId: 'task-3', reviewerId: 'user-3', revieweeId: 'user-4', rating: 5, comment: 'Priya did an amazing job! The articles were well-researched and delivered on time. Highly recommended.', timestamp: '2024-07-21T14:00:00Z' },
  { id: 'review-2', taskId: 'task-3', reviewerId: 'user-4', revieweeId: 'user-3', rating: 5, comment: 'Rohan was a great client. Clear communication and prompt payment. Would love to work with him again.', timestamp: '2024-07-21T14:05:00Z' }
];

// Helper functions to get data
export const getTaskById = (id: string) => tasks.find(task => task.id === id);
export const getUserById = (id: string) => users.find(user => user.id === id);
export const getBidsForTask = (taskId: string) => bids.filter(bid => bid.taskId === taskId);
export const getReviewsForUser = (userId: string) => reviews.filter(review => review.revieweeId === userId);
