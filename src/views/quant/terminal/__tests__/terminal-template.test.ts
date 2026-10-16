import { parse as parseTemplate } from '@vue/compiler-dom';
import { parse as parseSfc } from '@vue/compiler-sfc';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

describe('strategy instance symbol link', () => {
  it('routes a symbol click through the existing K-line switch handler', () => {
    const source = readFileSync(fileURLToPath(new URL('../index.vue', import.meta.url)), 'utf8');
    const { descriptor } = parseSfc(source);
    const template = parseTemplate(descriptor.template?.content || '');
    const nodes = [template as any];
    let symbolLink: any;

    while (nodes.length) {
      const node = nodes.pop();
      if (!node || typeof node !== 'object') continue;
      if (node.type === 1 && node.tag === 'el-link' && node.loc?.source.includes('{{ item.symbol }}')) {
        symbolLink = node;
        break;
      }
      if (Array.isArray(node.children)) nodes.push(...node.children);
    }

    expect(symbolLink?.props).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 7,
          name: 'on',
          arg: expect.objectContaining({ content: 'click' }),
          exp: expect.objectContaining({ content: 'selectRowSymbol(item)' })
        })
      ])
    );
  });

  it('routes a realtime slope symbol click through the K-line switch handler', () => {
    const source = readFileSync(fileURLToPath(new URL('../index.vue', import.meta.url)), 'utf8');
    const { descriptor } = parseSfc(source);
    const template = parseTemplate(descriptor.template?.content || '');
    const nodes = [template as any];
    let symbolColumn: any;

    while (nodes.length) {
      const node = nodes.pop();
      if (!node || typeof node !== 'object') continue;
      if (
        node.type === 1 &&
        node.tag === 'el-table-column' &&
        node.props?.some((prop: any) => prop.name === 'label' && prop.value?.content === '交易对')
      ) {
        symbolColumn = node;
        break;
      }
      if (Array.isArray(node.children)) nodes.push(...node.children);
    }

    const columnNodes = [...(symbolColumn?.children || [])];
    let slopeSymbolLink: any;
    while (columnNodes.length) {
      const node = columnNodes.pop();
      if (!node || typeof node !== 'object') continue;
      if (node.type === 1 && node.tag === 'el-link' && node.loc?.source.includes('{{ scope.row.symbol }}')) {
        slopeSymbolLink = node;
        break;
      }
      if (Array.isArray(node.children)) columnNodes.push(...node.children);
    }

    expect(slopeSymbolLink?.props).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 7,
          name: 'on',
          arg: expect.objectContaining({ content: 'click' }),
          exp: expect.objectContaining({ content: 'selectRowSymbol({ symbol: scope.row.symbol })' })
        })
      ])
    );
  });
});
