import * as React from 'react';
import * as ReactDOM from 'react-dom';

const Thing = () => <div>Thing</div>;

describe('it', () => {
  it('renders without crashing', () => {
    const div = document.createElement('div');
    ReactDOM.render(<Thing />, div);
    ReactDOM.unmountComponentAtNode(div);
  });
});
