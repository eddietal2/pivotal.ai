import '@testing-library/jest-dom'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { ThemeProvider } from '../../components/context/ThemeContext.js'
import Home from '../pages/index.jsx'

import fetchMock from 'jest-fetch-mock';
import { describe } from 'node:test';
fetchMock.enableMocks();


