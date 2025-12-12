import { render } from '@testing-library/svelte';
import HelloWorld from '../components/HelloWorld.svelte';

describe('HelloWorld component', () => {
  test('renders correctly', () => {
    const { getByText } = render(HelloWorld);
    expect(getByText('Hello World')).toBeInTheDocument();
  });
});