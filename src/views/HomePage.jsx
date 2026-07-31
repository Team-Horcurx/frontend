import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMapPin, FiUsers, FiBarChart2, FiSettings, FiArrowRight } from 'react-icons/fi';
import PageMotion from '../components/PageMotion.jsx';
import './HomePage.css';

const ROLES = [
  {
    path: '/officer',
    icon: FiMapPin,
    title: 'Field Officer',
    description: 'Verify flagged properties on the map, review satellite evidence, and update verification status.',
    accent: 'var(--color-primary)',
  },
  {
    path: '/supervisor',
    icon: FiUsers,
    title: 'Supervisor',
    description: 'Monitor ward-level stats, review AI-generated alerts, and export ward reports.',
    accent: 'var(--color-success)',
  },
  {
    path: '/commissioner',
    icon: FiBarChart2,
    title: 'Commissioner',
    description: 'City-wide heatmap, top unassessed wards, revenue estimates, and AI daily brief.',
    accent: 'var(--color-warning)',
  },
  {
    path: '/admin',
    icon: FiSettings,
    title: 'Admin Panel',
    description: 'Upload GVMC property CSV, configure database, adjust detection threshold, trigger pipeline.',
    accent: 'var(--color-danger)',
  },
];

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <PageMotion className="home-page">
      <div className="home-page__hero">
        <span className="view-kicker">GVMC · Change-Detection Engine</span>
        <h1 className="home-page__title">Satellite intelligence for Visakhapatnam's 98 wards</h1>
        <p className="home-page__subtitle">Select a workspace to continue</p>
      </div>

      <div className="home-page__launcher">
        {ROLES.map(({ path, icon: Icon, title, description, accent }, i) => (
          <div
            key={path}
            className="launcher-row"
            style={{ '--accent': accent, '--row-index': i }}
            onClick={() => navigate(path)}
          >
            <span className="launcher-row__icon-wrap">
              <Icon className="launcher-row__icon" />
            </span>
            <div className="launcher-row__content">
              <h2 className="launcher-row__title">{title}</h2>
              <p className="launcher-row__desc">{description}</p>
            </div>
            <span className="launcher-row__arrow">
              <FiArrowRight />
            </span>
          </div>
        ))}
      </div>
    </PageMotion>
  );
}
