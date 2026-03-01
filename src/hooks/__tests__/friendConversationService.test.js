const { makeFriendConversationId } = require('../friendConversationService');

describe('makeFriendConversationId', () => {
  test('produces a sorted deterministic ID', () => {
    expect(makeFriendConversationId('alice', 'bob')).toBe('alice_bob');
  });

  test('order does not matter — (b, a) === (a, b)', () => {
    expect(makeFriendConversationId('b', 'a')).toBe(makeFriendConversationId('a', 'b'));
  });

  test('same UID produces uid_uid', () => {
    expect(makeFriendConversationId('xyz', 'xyz')).toBe('xyz_xyz');
  });

  test('handles UIDs with mixed case', () => {
    const id = makeFriendConversationId('Zara', 'Adam');
    expect(id).toBe('Adam_Zara');
  });
});
