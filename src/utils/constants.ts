import { Service } from '../types';

export const SERVICES: Service[] = [
  {
    id: 'haircut',
    name: 'Standard Hair Cut',
    price: 400,
    duration: 60,
  },
  {
    id: 'shaving',
    name: 'Shaving',
    price: 200,
    duration: 30,
  },
  {
    id: 'facemask',
    name: 'Face Mask',
    price: 100,
    duration: 30,
  },
  {
    id: 'beard-trim',
    name: 'Beard Trim',
    price: 150,
    duration: 30,
  },
  {
    id: 'hair-wash',
    name: 'Hair Wash',
    price: 50,
    duration: 15,
  },
];

export const TIME_SLOTS = [
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
  '19:00', '19:30', '20:00', '20:30', '21:00'
];

export const WORKING_HOURS = {
  start: 10,
  end: 21,
  interval: 30, // minutes
};