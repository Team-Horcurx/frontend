import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMapPin, FiUsers, FiBarChart2, FiSettings } from 'react-icons/fi';
import { MdSatellite } from 'react-icons/md';
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
        <MdSatellite className="home-page__hero-icon" />
        <h1 className="home-page__title">GVMC Change-Detection Engine</h1>
        <p className="home-page__subtitle">
          Satellite-powered property tax assessment for Visakhapatnam's 98 wards
        </p>
      </div>

      <div className="home-page__roles">
        {ROLES.map(({ path, icon: Icon, title, description, accent }) => (
          <div
            key={path}
            className="role-card"
            style={{ '--accent': accent }}
            onClick={() => navigate(path)}
          >
            <div className="role-card__icon-wrap">
              <Icon className="role-card__icon" />
            </div>
            <h2 className="role-card__title">{title}</h2>
            <p className="role-card__desc">{description}</p>
            <button className="role-card__btn">Enter →</button>
          </div>
        ))}
      </div>
    </PageMotion>
  );
}
