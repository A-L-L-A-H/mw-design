import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import * as rootUi from '../dist/index.js';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Alert,
  AlertDescription,
  AlertTitle,
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Checkbox,
  CopyButton,
  Input,
  Panel,
  Progress,
  RadioGroup,
  RadioGroupItem,
  SelectField,
  Separator,
  Spinner,
  Switch,
  Textarea,
  ThemeProvider,
  applyThemeState,
  useTheme,
} from '../dist/index.js';

const FORWARD_REF_SYMBOL = Symbol.for('react.forward_ref');

test('root barrel @moonwitness/ui exports core primitives and theme provider', () => {
  const expectedExports = [
    'Button',
    'Badge',
    'Avatar',
    'Checkbox',
    'Textarea',
    'SelectField',
    'Input',
    'Panel',
    'Switch',
    'Alert',
    'AlertTitle',
    'AlertDescription',
    'Progress',
    'Spinner',
    'Separator',
    'Card',
    'CardHeader',
    'CardTitle',
    'CardDescription',
    'CardContent',
    'CardFooter',
    'Accordion',
    'AccordionItem',
    'AccordionTrigger',
    'AccordionContent',
    'RadioGroup',
    'RadioGroupItem',
    'CopyButton',
    'ThemeProvider',
    'useTheme',
    'applyThemeState',
  ];

  for (const exportName of expectedExports) {
    assert.ok(exportName in rootUi, `Expected ${exportName} to be exported from @moonwitness/ui`);
  }
});

test('core primitives support React.forwardRef', () => {
  const components = [
    ['Button', Button],
    ['Badge', Badge],
    ['Avatar', Avatar],
    ['Checkbox', Checkbox],
    ['Textarea', Textarea],
    ['SelectField', SelectField],
    ['Input', Input],
    ['Panel', Panel],
    ['Switch', Switch],
    ['Alert', Alert],
    ['Progress', Progress],
    ['Spinner', Spinner],
    ['Separator', Separator],
    ['Card', Card],
    ['RadioGroup', RadioGroup],
    ['RadioGroupItem', RadioGroupItem],
    ['CopyButton', CopyButton],
  ];

  for (const [name, Component] of components) {
    assert.equal(
      Component?.$$typeof,
      FORWARD_REF_SYMBOL,
      `Expected ${name} to be wrapped with React.forwardRef`
    );
  }
});

test('Button loading state disables interaction, marks aria-busy, and renders spinner', () => {
  const html = renderToStaticMarkup(
    React.createElement(Button, { loading: true }, 'Publishing')
  );
  assert.match(html, /aria-busy="true"/);
  assert.match(html, /data-loading="true"/);
  assert.match(html, /disabled=""/);
  assert.match(html, /mw-ui-button-spinner/);
  assert.match(html, /Publishing/);
});

test('Badge supports semantic success/warning variants and sm size', () => {
  const successHtml = renderToStaticMarkup(
    React.createElement(Badge, { variant: 'success', size: 'sm' }, 'Verified')
  );
  const warningHtml = renderToStaticMarkup(
    React.createElement(Badge, { variant: 'warning' }, 'Pending')
  );

  assert.match(successHtml, /data-variant="success"/);
  assert.match(successHtml, /data-size="sm"/);
  assert.match(warningHtml, /data-variant="warning"/);
});

test('Avatar, Input, SelectField, and Textarea render unified size/class hooks', () => {
  const avatarHtml = renderToStaticMarkup(
    React.createElement(Avatar, { name: 'Moon Witness', size: 'lg' })
  );
  const inputHtml = renderToStaticMarkup(
    React.createElement(Input, { controlSize: 'sm', placeholder: 'Slug' })
  );
  const selectHtml = renderToStaticMarkup(
    React.createElement(
      SelectField,
      { controlSize: 'lg', 'aria-label': 'Status' },
      React.createElement('option', { value: 'live' }, 'Live')
    )
  );
  const textareaHtml = renderToStaticMarkup(
    React.createElement(Textarea, { placeholder: 'Field notes' })
  );

  assert.match(avatarHtml, /data-size="lg"/);
  assert.match(inputHtml, /data-size="sm"/);
  assert.match(selectHtml, /data-size="lg"/);
  assert.match(textareaHtml, /class="mw-ui-textarea"/);
  assert.doesNotMatch(textareaHtml, /focus-visible:outline-yellow/);
});

test('Switch renders pure mw-ui classes without Tailwind utility dependency', () => {
  const html = renderToStaticMarkup(
    React.createElement(Switch, { checked: true, size: 'sm', 'aria-label': 'Auto sync' })
  );
  assert.match(html, /class="mw-ui-switch"/);
  assert.match(html, /data-size="sm"/);
  assert.match(html, /class="mw-ui-switch-thumb"/);
  assert.doesNotMatch(html, /bg-\[var\(/);
});

test('Alert renders accessible roles, variants, and dismiss control', () => {
  const infoHtml = renderToStaticMarkup(
    React.createElement(
      Alert,
      { variant: 'info' },
      React.createElement(AlertTitle, null, 'Synced'),
      React.createElement(AlertDescription, null, 'Workspace is up to date.')
    )
  );
  const dangerHtml = renderToStaticMarkup(
    React.createElement(
      Alert,
      { variant: 'destructive', onDismiss: () => {} },
      React.createElement(AlertTitle, null, 'Failed')
    )
  );

  assert.match(infoHtml, /role="status"/);
  assert.match(infoHtml, /data-variant="info"/);
  assert.match(dangerHtml, /role="alert"/);
  assert.match(dangerHtml, /mw-ui-alert-dismiss/);
  assert.match(dangerHtml, /aria-label="Dismiss alert"/);
});

test('Progress renders accessible progressbar and indeterminate mode', () => {
  const determinateHtml = renderToStaticMarkup(
    React.createElement(Progress, {
      value: 45,
      max: 100,
      label: 'Upload',
      showValue: true,
      variant: 'success',
      size: 'lg',
    })
  );
  const indeterminateHtml = renderToStaticMarkup(
    React.createElement(Progress, { indeterminate: true, label: 'Streaming' })
  );

  assert.match(determinateHtml, /role="progressbar"/);
  assert.match(determinateHtml, /aria-valuenow="45"/);
  assert.match(determinateHtml, /45%/);
  assert.match(determinateHtml, /data-variant="success"/);
  assert.match(indeterminateHtml, /data-indeterminate="true"/);
});

test('Spinner, Separator, Card, Accordion, RadioGroup, and CopyButton render cleanly', () => {
  const spinnerHtml = renderToStaticMarkup(
    React.createElement(Spinner, { size: 'lg', label: 'Fetching data', showLabel: true })
  );
  const separatorHtml = renderToStaticMarkup(
    React.createElement(Separator, { label: 'OR', variant: 'dashed' })
  );
  const cardHtml = renderToStaticMarkup(
    React.createElement(
      Card,
      { variant: 'elevated' },
      React.createElement(
        CardHeader,
        null,
        React.createElement(CardTitle, null, 'Briefing'),
        React.createElement(CardDescription, null, 'Summary')
      ),
      React.createElement(CardContent, null, 'Body'),
      React.createElement(CardFooter, null, 'Footer')
    )
  );
  const accordionHtml = renderToStaticMarkup(
    React.createElement(
      Accordion,
      { type: 'single', collapsible: true, defaultValue: 'q1' },
      React.createElement(
        AccordionItem,
        { value: 'q1' },
        React.createElement(AccordionTrigger, null, 'Question 1'),
        React.createElement(AccordionContent, null, 'Answer 1')
      )
    )
  );
  const radioHtml = renderToStaticMarkup(
    React.createElement(
      RadioGroup,
      { defaultValue: 'a', 'aria-label': 'Choices' },
      React.createElement(RadioGroupItem, { value: 'a', id: 'choice-a' })
    )
  );
  const copyHtml = renderToStaticMarkup(
    React.createElement(CopyButton, { value: 'npm i @moonwitness/ui', label: 'Copy install' })
  );

  assert.match(spinnerHtml, /role="status"/);
  assert.match(spinnerHtml, /Fetching data/);
  assert.match(separatorHtml, /role="separator"/);
  assert.match(separatorHtml, /OR/);
  assert.match(cardHtml, /mw-ui-card/);
  assert.match(cardHtml, /data-variant="elevated"/);
  assert.match(accordionHtml, /mw-ui-accordion/);
  assert.match(accordionHtml, /Question 1/);
  assert.match(radioHtml, /role="radiogroup"/);
  assert.match(radioHtml, /role="radio"/);
  assert.match(copyHtml, /data-slot="copy-button"/);
  assert.match(copyHtml, /Copy install/);
});

test('ThemeProvider and applyThemeState manage theme, skin, density, and root classes', () => {
  const classes = new Set();
  const fakeRoot = {
    dataset: {},
    classList: {
      toggle(cls, force) {
        if (force) classes.add(cls);
        else classes.delete(cls);
      },
    },
  };

  applyThemeState(
    { mode: 'high-contrast', skin: 'moonwitness', density: 'compact' },
    fakeRoot
  );
  assert.equal(fakeRoot.dataset.theme, 'high-contrast');
  assert.equal(fakeRoot.dataset.skin, 'moonwitness');
  assert.equal(fakeRoot.dataset.density, 'compact');
  assert.equal(classes.has('high-contrast'), true);
  assert.equal(classes.has('dark'), false);

  applyThemeState({ mode: 'dark', skin: 'moonwitness', density: 'comfortable' }, fakeRoot);
  assert.equal(fakeRoot.dataset.theme, 'dark');
  assert.equal(classes.has('dark'), true);
  assert.equal(classes.has('high-contrast'), false);

  function Consumer() {
    const theme = useTheme();
    return React.createElement(
      'output',
      { 'data-testid': 'theme-state' },
      `${theme.mode}:${theme.density}`
    );
  }

  const providerHtml = renderToStaticMarkup(
    React.createElement(
      ThemeProvider,
      { defaultMode: 'dark', defaultDensity: 'compact', storageKey: null },
      React.createElement(Consumer)
    )
  );
  assert.match(providerHtml, /dark:compact/);
});

test('components.css removes noisy halftone from inputs and ships styles for all new primitives', () => {
  const cssPath = path.resolve(import.meta.dirname, '../src/styles/components.css');
  const css = fs.readFileSync(cssPath, 'utf8');

  const inputBlockMatch = css.match(
    /\.mw-ui-input,\s*\.mw-ui-select,\s*\.mw-ui-textarea,\s*\.mw-ui-select-trigger\s*\{[\s\S]*?\}/
  );
  assert.ok(inputBlockMatch, 'Expected .mw-ui-input base block');
  assert.doesNotMatch(
    inputBlockMatch[0],
    /radial-gradient/,
    'Form inputs should not have halftone dots inside the typing surface'
  );

  for (const selector of [
    '.mw-ui-checkbox::before',
    '.mw-ui-switch-thumb',
    '.mw-ui-badge[data-variant=\'success\']',
    '.mw-ui-badge[data-variant=\'warning\']',
    '.mw-ui-avatar[data-size=\'lg\']',
    '.mw-ui-alert',
    '.mw-ui-progress-indicator',
    '.mw-ui-spinner-ring',
    '.mw-ui-separator',
    '.mw-ui-card',
    '.mw-ui-accordion-trigger',
    '.mw-ui-radio-item',
    '.mw-ui-dialog-content',
  ]) {
    assert.ok(css.includes(selector), `Expected components.css to define ${selector}`);
  }
});
