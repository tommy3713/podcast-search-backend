import { Client } from '@elastic/elasticsearch';

const client = new Client({
  node: 'http://elasticsearch:9200',
});

export const search = async (keyword) => {
  const result = await client.search({
    index: 'podcast',
    body: {
      query: {
        match: { content: keyword },
      },
      highlight: {
        fields: {
          content: {},
        },
        pre_tags: ['{{HIGHLIGHT}}'],
        post_tags: ['{{/HIGHLIGHT}}'],
      },
      _source: {
        excludes: ['content'],
      },
    },
  });
  return result.hits.hits.map((hit) => ({
    podcaster: hit._source.podcaster,
    title: hit._source.title,
    uploadDate: hit._source.uploadDate,
    episode: hit._source.episode,
    fullTitle: hit._source.fullTitle,
    highlights: hit.highlight.content,
  }));
};
