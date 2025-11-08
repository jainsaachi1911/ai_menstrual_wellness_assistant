import React, { useState } from 'react';
import { ChevronDown, ChevronUp, BookOpen, Heart, Droplet, Calendar, Clock, AlertCircle } from 'lucide-react';
import '../styles/Card.css';

const Card = () => {
  const [expandedCard, setExpandedCard] = useState(0);

  const cardData = [
    {
      id: 1,
      title: "What is a Menstrual Cycle?",
      icon: <Calendar size={24} />,
      color: "card-pink",
      content: "The menstrual cycle is a term to describe the sequence of events that occur in your body as it prepares for the possibility of pregnancy each month. Your menstrual cycle is the time from the first day of your menstrual period until the first day of your next menstrual period. Every person's cycle is slightly different, but the process is the same.",
      keyPoints: [
        "Occurs monthly in people with a uterus",
        "Prepares body for pregnancy",
        "Cycle length varies by person",
        "Average cycle: 28 days"
      ]
    },
    {
      id: 2,
      title: "Normal Menstrual Cycle Length",
      icon: <Clock size={24} />,
      color: "card-purple",
      content: "The average length of a menstrual cycle is 28 days. However, a cycle can range in length from 21 days to about 35 days and still be normal.",
      keyPoints: [
        "Average: 28 days",
        "Normal range: 21-35 days",
        "Variations are normal",
        "Each person is unique"
      ]
    },
    {
      id: 3,
      title: "Days Between Periods",
      icon: <Droplet size={24} />,
      color: "card-red",
      content: "The days between periods is your menstrual cycle length. The average menstrual cycle lasts 28 days. However, cycles lasting as little as 21 days or as long as 35 days can be normal.",
      keyPoints: [
        "Cycle length: First day to first day",
        "Average: 28 days",
        "Range: 21-35 days",
        "Track for better understanding"
      ]
    },
    {
      id: 4,
      title: "Period Duration",
      icon: <Heart size={24} />,
      color: "card-coral",
      content: "Most people have their period (bleed) for between three and seven days.",
      keyPoints: [
        "Normal duration: 3-7 days",
        "Bleeding varies by person",
        "Track your pattern",
        "Consistency is key"
      ]
    },
    {
      id: 5,
      title: "Is a Three-Day Period Normal?",
      icon: <AlertCircle size={24} />,
      color: "card-blue",
      content: "A period is normal if it's anywhere between three and seven days. While on the shorter end of the range, some people have a menstrual period that lasts only three days. This is OK.",
      keyPoints: [
        "3 days is within normal range",
        "No need to worry",
        "Everyone is different",
        "Monitor for changes"
      ]
    },
    {
      id: 6,
      title: "Four Phases of Menstrual Cycle",
      icon: <BookOpen size={24} />,
      color: "card-teal",
      content: "The rise and fall of hormones trigger the steps in your menstrual cycle. Hormones cause the specific events that occur during your menstrual cycle.",
      phases: [
        {
          name: "Menstrual Phase",
          description: "Begins on the first day of your period. The lining of your uterus sheds through your vagina. Pregnancy hasn't occurred. Next period bleed for three to five days, but a period lasting only three days to as many as seven days is usually not a cause for worry."
        },
        {
          name: "Follicular Phase",
          description: "Begins the day your period ends at ovulation. During this time, the level of the hormone estrogen rises, which causes the endometrium to grow and thicken. Another hormone—follicle-stimulating hormone (FSH)—causes the ovaries to produce follicles that contain eggs."
        },
        {
          name: "Ovulation Phase",
          description: "Occurs roughly about day 14 in a 28-day menstrual cycle. A sudden increase in another hormone—luteinizing hormone (LH)—causes your ovary to release an egg."
        },
        {
          name: "Luteal Phase",
          description: "Begins after ovulation and lasts until your period starts. The empty follicle transforms into the corpus luteum, which produces progesterone to prepare the uterus for a fertilized egg."
        }
      ]
    }
  ];

  const toggleCard = (id) => {
    setExpandedCard(expandedCard === id ? null : id);
  };

  return (
    <div className="card-page-container">
      {/* Header */}
      <div className="card-header">
        <div className="header-content">
          <h1 className="header-title">Understanding Your Menstrual Cycle</h1>
          <p className="header-subtitle">Learn about the phases, duration, and what's normal for your body</p>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="cards-grid">
        {cardData.map((card) => (
          <div
            key={card.id}
            className={`info-card ${card.color} ${expandedCard === card.id ? 'expanded' : ''}`}
            onClick={() => toggleCard(card.id)}
          >
            {/* Card Header */}
            <div className="card-header-content">
              <div className="card-icon-wrapper">
                {card.icon}
              </div>
              <div className="card-title-section">
                <h2 className="card-title">{card.title}</h2>
                <div className="expand-indicator">
                  {expandedCard === card.id ? (
                    <ChevronUp size={20} />
                  ) : (
                    <ChevronDown size={20} />
                  )}
                </div>
              </div>
            </div>

            {/* Card Content */}
            {expandedCard === card.id && (
              <div className="card-content">
                <p className="card-description">{card.content}</p>

                {/* Key Points */}
                {card.keyPoints && (
                  <div className="key-points">
                    <h3 className="key-points-title">Key Points:</h3>
                    <ul className="points-list">
                      {card.keyPoints.map((point, idx) => (
                        <li key={idx} className="point-item">
                          <span className="point-bullet">•</span>
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Phases */}
                {card.phases && (
                  <div className="phases-container">
                    <h3 className="phases-title">The Four Phases:</h3>
                    <div className="phases-list">
                      {card.phases.map((phase, idx) => (
                        <div key={idx} className="phase-item">
                          <div className="phase-header">
                            <span className="phase-number">{idx + 1}</span>
                            <h4 className="phase-name">{phase.name}</h4>
                          </div>
                          <p className="phase-description">{phase.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer Info */}
      <div className="card-footer">
        <div className="footer-content">
          <h3 className="footer-title">💡 Remember</h3>
          <p className="footer-text">
            Every person's menstrual cycle is unique. What's normal for you might be different from others. 
            Track your cycle to understand your body better and identify any changes that might need medical attention.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Card;
