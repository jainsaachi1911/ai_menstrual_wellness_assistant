import React, { useState } from 'react';
import { ChevronDown, ChevronUp, AlertTriangle, TrendingDown, Heart, Zap, Clock, BookOpen } from 'lucide-react';
import '../styles/Card2.css';

const Card2 = () => {
  const [expandedCard, setExpandedCard] = useState(0);

  const cardData = [
    {
      id: 1,
      title: "What are Irregular Periods?",
      icon: <TrendingDown size={24} />,
      color: "card-orange",
      content: "Most women have menstrual periods that last four to seven days. Your period usually occurs every 28 days, but menstrual cycles can range from 21 days to 35 days. In fact, the average cycle length is 29 days. Many things cause irregular periods (or irregular menstruation) such as changes in hormone levels, stress, certain health conditions, medications and more.",
      keyPoints: [
        "Normal cycle: 21-35 days",
        "Average: 29 days",
        "Caused by hormone changes",
        "Stress and health conditions affect cycles",
        "Medications can cause irregularity"
      ]
    },
    {
      id: 2,
      title: "Examples of Irregular Periods",
      icon: <AlertTriangle size={24} />,
      color: "card-red-dark",
      content: "Your period is still considered 'regular' even if it varies slightly from cycle to cycle. Examples of true menstruation irregularities include periods that occur fewer than 21 days or more than 35 days apart.",
      examples: [
        {
          name: "Periods < 21 or > 35 days",
          description: "Periods that occur fewer than 21 days or more than 35 days apart"
        },
        {
          name: "Missing 3+ Periods",
          description: "Missing three or more periods in a row"
        },
        {
          name: "Heavy Bleeding",
          description: "Menstrual flow (bleeding) that's much heavier or lighter than usual"
        },
        {
          name: "Prolonged Periods",
          description: "Periods that last longer than seven days"
        },
        {
          name: "Varying Cycle Length",
          description: "Length of time between cycles varies more than nine days. For example, one cycle is 28 days, the next is 37 days and the next is 29 days"
        },
        {
          name: "Severe Symptoms",
          description: "Periods that are accompanied by severe pain, cramping, nausea or vomiting"
        },
        {
          name: "Bleeding Between Periods",
          description: "Bleeding or spotting that happens between periods, after menopause or after sexual intercourse"
        },
        {
          name: "Heavy Soaking",
          description: "Soaking through one or more tampons or sanitary pads in an hour"
        }
      ]
    },
    {
      id: 3,
      title: "Conditions Related to Irregular Menstruation",
      icon: <Heart size={24} />,
      color: "card-pink-dark",
      content: "Several medical conditions can cause irregular periods. It's important to understand these conditions if you're experiencing menstrual irregularities.",
      conditions: [
        {
          name: "Amenorrhea",
          description: "A condition where your periods have stopped completely. The absence of a period for 90 days or more is considered abnormal unless you're pregnant, breastfeeding or going through menopause (which generally occurs between ages 45 and 55). If you haven't started menstruating by age 15 or 16 when these symptoms develop, you may also have amenorrhea."
        },
        {
          name: "Oligomenorrhea",
          description: "A condition where your periods occur infrequently. You may go more than 35 days between periods or have fewer than nine periods a year."
        },
        {
          name: "Dysmenorrhea",
          description: "A medical term for painful periods and severe menstrual cramps. Some discomfort during your cycle is normal."
        },
        {
          name: "Abnormal Uterine Bleeding",
          description: "Abnormal uterine bleeding is bleeding between monthly periods, prolonged bleeding or an extremely heavy period."
        }
      ]
    },
    {
      id: 4,
      title: "Understanding Your Cycle",
      icon: <Clock size={24} />,
      color: "card-blue-dark",
      content: "Your menstrual cycle may not always be predictable — and that may be OK. It's normal to have slight variations in cycle length or have a menstrual period that seems slightly heavier or lighter in flow than your previous period.",
      keyPoints: [
        "Slight variations are normal",
        "Cycle length can vary month to month",
        "Flow can vary between periods",
        "Irregularities are fairly common",
        "Don't panic over minor changes",
        "Track patterns to identify true irregularities"
      ]
    },
    {
      id: 5,
      title: "When to Seek Help",
      icon: <Zap size={24} />,
      color: "card-purple-dark",
      content: "While irregular periods are common, it's important to know when to consult a healthcare provider. If you notice significant changes in your menstrual pattern or experience concerning symptoms, reach out to your doctor.",
      keyPoints: [
        "Sudden changes in cycle pattern",
        "Missing 3+ consecutive periods",
        "Extremely heavy or prolonged bleeding",
        "Severe pain or cramping",
        "Bleeding between periods",
        "Symptoms affecting daily life",
        "Concerns about fertility"
      ]
    },
    {
      id: 6,
      title: "Tips for Tracking Irregularities",
      icon: <BookOpen size={24} />,
      color: "card-teal-dark",
      content: "Keeping track of your menstrual cycle can help you identify patterns and determine if your periods are truly irregular or just varying slightly.",
      tips: [
        {
          title: "Use a Calendar",
          description: "Mark the first and last day of your period each month"
        },
        {
          title: "Track Symptoms",
          description: "Note pain level, flow intensity, and any other symptoms"
        },
        {
          title: "Monitor Cycle Length",
          description: "Calculate days between periods to identify patterns"
        },
        {
          title: "Note Changes",
          description: "Record any significant changes in your cycle"
        },
        {
          title: "Share with Doctor",
          description: "Bring your tracking data to medical appointments"
        },
        {
          title: "Use Apps",
          description: "Consider using period tracking apps for easy monitoring"
        }
      ]
    }
  ];

  const toggleCard = (id) => {
    setExpandedCard(expandedCard === id ? null : id);
  };

  return (
    <div className="card-page-container card2-container">
      {/* Header */}
      <div className="card-header">
        <div className="header-content">
          <h1 className="header-title">Understanding Irregular Periods</h1>
          <p className="header-subtitle">Learn about irregular menstruation, causes, and when to seek help</p>
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

                {/* Examples */}
                {card.examples && (
                  <div className="examples-container">
                    <h3 className="examples-title">Examples of Irregularities:</h3>
                    <div className="examples-list">
                      {card.examples.map((example, idx) => (
                        <div key={idx} className="example-item">
                          <div className="example-header">
                            <span className="example-number">{idx + 1}</span>
                            <h4 className="example-name">{example.name}</h4>
                          </div>
                          <p className="example-description">{example.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Conditions */}
                {card.conditions && (
                  <div className="conditions-container">
                    <h3 className="conditions-title">Medical Conditions:</h3>
                    <div className="conditions-list">
                      {card.conditions.map((condition, idx) => (
                        <div key={idx} className="condition-item">
                          <div className="condition-header">
                            <h4 className="condition-name">{condition.name}</h4>
                          </div>
                          <p className="condition-description">{condition.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tips */}
                {card.tips && (
                  <div className="tips-container">
                    <h3 className="tips-title">Tracking Tips:</h3>
                    <div className="tips-list">
                      {card.tips.map((tip, idx) => (
                        <div key={idx} className="tip-item">
                          <div className="tip-header">
                            <span className="tip-number">{idx + 1}</span>
                            <h4 className="tip-name">{tip.title}</h4>
                          </div>
                          <p className="tip-description">{tip.description}</p>
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
          <h3 className="footer-title">⚠️ Important Note</h3>
          <p className="footer-text">
            If you experience significant changes in your menstrual pattern or have concerns about irregular periods, 
            consult with a healthcare provider. They can help determine the cause and recommend appropriate treatment options.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Card2;
