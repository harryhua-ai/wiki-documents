import React from 'react';
import { useColorMode } from '@docusaurus/theme-common';

interface ScenarioItem {
  title: string;
  description: string;
  image?: string;
  imageAlt?: string;
}

interface ScenarioCategory {
  title: string;
  items: ScenarioItem[];
}

interface ApplicationScenariosProps {
  introduction?: string;
  categories: ScenarioCategory[];
  imagePosition?: 'top' | 'left' | 'center' | 'none';
  imageHeight?: number | string;
  imageWidth?: number | string;
  maxDescriptionLines?: number; // 描述文本最大行数
}

const ApplicationScenarios: React.FC<ApplicationScenariosProps> = ({ 
  introduction, 
  categories, 
  imagePosition = 'top', 
  imageHeight = 160, 
  imageWidth = '100%',
  maxDescriptionLines = 3 // 默认最多显示3行
}) => {
  const { colorMode } = useColorMode();
  const isDarkTheme = colorMode === 'dark';
  
  // 根据图像位置设置卡片布局
  const isLeftImage = imagePosition === 'left';
  const isCenterImage = imagePosition === 'center';
  
  return (
    <div className="application-scenarios" style={{ marginBottom: '30px' }}>
      {introduction && <p>{introduction}</p>}
      
      {categories.map((category, catIndex) => (
        <div key={catIndex}>
          <h4 style={{ 
            fontSize: '1.35rem', 
            fontWeight: '600', 
            margin: '25px 0 15px 0',
            paddingBottom: '8px',
            borderBottom: `1px solid var(--ifm-color-emphasis-200)`,
            position: 'relative'
          }}>
            <span style={{
              position: 'relative',
              paddingBottom: '8px',
              display: 'inline-block'
            }}>
              {category.title}
              <span style={{
                position: 'absolute',
                bottom: '-8px',
                left: 0,
                width: '60%',
                height: '2px',
                borderRadius: '2px'
              }} />
            </span>
          </h4>
          <div className="scenario-details" style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(2, 1fr)', 
            gap: '20px', 
            marginBottom: '25px' 
          }}>
            {category.items.map((item, itemIndex) => (
              <div 
                key={itemIndex} 
                className="scenario-item" 
                style={{ 
                  padding: '15px', 
                  border: `1px solid var(--ifm-color-emphasis-200)`,
                  borderRadius: 'var(--ifm-card-border-radius)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  cursor: 'default',
                  height: '100%',
                  display: 'flex',
                  overflow: 'hidden',
                  flexDirection: 'row'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {/* 图像显示始终在左侧 */}
                {item.image && (
                  <div 
                    className="scenario-item-image"
                    style={{
                      flex: '0 0 120px',
                      marginRight: '15px',
                      height: 'auto',
                      width: '120px',
                      overflow: 'hidden',
                      borderRadius: '0',
                      padding: 0
                    }}
                  >
                    <img 
                      src={item.image} 
                      alt={item.imageAlt || item.title} 
                      style={{
                        width: '100%',
                        height: 'auto',
                        maxHeight: '140px',
                        objectFit: 'contain',
                        objectPosition: 'center',
                        display: 'block',
                        margin: 0,
                        borderRadius: 0
                      }}
                    />
                  </div>
                )}
                
                <div style={{ flex: '1' }}>
                  <strong style={{ 
                    fontSize: '1.1rem', 
                    display: 'block', 
                    marginBottom: '10px',
                    fontWeight: '600',
                    lineHeight: '1.4',
                    paddingLeft: '10px'
                  }}>
                    {item.title}
                  </strong>
                  <p style={{ 
                    margin: 0, 
                    lineHeight: '1.5',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: maxDescriptionLines,
                    WebkitBoxOrient: 'vertical',
                    position: 'relative',
                  }}
                  title={item.description}
                  data-tooltip-instant="true">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ApplicationScenarios; 
