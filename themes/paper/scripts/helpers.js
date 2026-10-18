hexo.extend.helper.register('reading_time', function (post) {
  var text = (post.content || '').replace(/<[^>]+>/g, '').replace(/\s+/g, '');
  return Math.max(1, Math.round(text.length / 400));
});

hexo.extend.helper.register('plain_excerpt', function (post, len) {
  var text = (post.excerpt || post.content || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  if (text.length <= len) return text;
  var cut = text.slice(0, len);
  var m = cut.match(/^[\s\S]*[。！？；，,;：]/);
  if (m && m[0].length > len * 0.6) cut = m[0].replace(/[，,；;：:]$/, '');
  return cut + '…';
});

hexo.extend.helper.register('first_category', function (post) {
  return post.categories && post.categories.length ? post.categories.first().name : '随笔';
});
