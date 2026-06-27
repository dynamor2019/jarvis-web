'use client';

import { Store } from '../store/page';

export default function MockStorePage() {
  return <Store enableMock={true} />;
}
